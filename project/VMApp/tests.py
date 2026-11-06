from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from .models import Service_Data, Services, User, User_Data, Wish_List, Staff_Data, Staff_Commission, Staff_Transactions, PhoneOTP, User_Transactions


class WishListApprovalFlowTests(APITestCase):
    def setUp(self):
        self.requester = User.objects.create_user(
            username="requester",
            password="SafePass123!",
            Contact="9000000001",
            Role="user",
        )
        self.partner = User.objects.create_user(
            username="partner",
            password="SafePass123!",
            Contact="9000000002",
            Role="user",
        )
        User_Data.objects.create(
            User_id=self.requester,
            Valid_Upto=timezone.localdate(),
        )
        User_Data.objects.create(
            User_id=self.partner,
            WP_Contact="9000000002",
            Full_Address="Partner address",
            Valid_Upto=timezone.localdate() + timedelta(days=30),
        )

    def test_partner_approval_updates_status_and_accept_profiles(self):
        self.client.force_authenticate(user=self.requester)
        create_response = self.client.post(
            "/wish-list/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        request_id = create_response.data["id"]
        self.assertEqual(create_response.data["Status"], Wish_List.STATUS_SHORTLISTED)

        request_response = self.client.patch(f"/wish-list/{request_id}/request/")
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertEqual(request_response.data["Status"], Wish_List.STATUS_PENDING)

        self.client.force_authenticate(user=self.partner)
        incoming_response = self.client.get("/wish-list/incoming/")
        self.assertEqual(incoming_response.status_code, status.HTTP_200_OK)
        self.assertEqual(incoming_response.data[0]["id"], request_id)

        approve_response = self.client.patch(
            f"/wish-list/{request_id}/respond/",
            {"Status": "Approved"},
            format="json",
        )

        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_response.data["Status"], Wish_List.STATUS_APPROVED)
        partner_data = User_Data.objects.get(User_id=self.partner)
        self.assertIn(str(self.requester.pk), partner_data.Accept_Profiles)

        self.client.force_authenticate(user=self.requester)
        approved_response = self.client.get("/wish-list/approved/")
        self.assertEqual(approved_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approved_response.data[0]["id"], request_id)

        partner_profile_response = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(partner_profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(partner_profile_response.data["WP_Contact"], "9000000002")
        self.assertEqual(partner_profile_response.data["Full_Address"], "Partner address")

        requester_profile = User_Data.objects.get(User_id=self.requester)
        requester_profile.Valid_Upto = timezone.localdate() - timedelta(days=1)
        requester_profile.save(update_fields=["Valid_Upto"])
        expired_profile_response = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertNotIn("WP_Contact", expired_profile_response.data)
        self.assertNotIn("Full_Address", expired_profile_response.data)

        expired_request_response = self.client.post(
            "/wish-list/request/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        self.assertEqual(expired_request_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_partner_remove_approval_disapproves_and_locks_contact(self):
        # 1. Requester sends direct request and partner approves
        self.client.force_authenticate(user=self.requester)
        send_resp = self.client.post(
            "/wish-list/request/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        req_id = send_resp.data["id"]

        self.client.force_authenticate(user=self.partner)
        approve_resp = self.client.patch(
            f"/wish-list/{req_id}/respond/",
            {"Status": "Approved"},
            format="json",
        )
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_resp.data["Status"], Wish_List.STATUS_APPROVED)

        # Contact details unlocked for requester
        self.client.force_authenticate(user=self.requester)
        contact_resp = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(contact_resp.data["WP_Contact"], "9000000002")

        # 2. Partner disapproves / removes approval
        self.client.force_authenticate(user=self.partner)
        disapprove_resp = self.client.patch(
            f"/wish-list/{req_id}/respond/",
            {"Status": "disapproved"},
            format="json",
        )
        self.assertEqual(disapprove_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(disapprove_resp.data["Status"], Wish_List.STATUS_REJECTED)

        # Partner's Accept_Profiles should have requester removed
        partner_data = User_Data.objects.get(User_id=self.partner)
        self.assertNotIn(str(self.requester.pk), partner_data.Accept_Profiles or [])

        # Approved list should no longer include this request
        approved_resp = self.client.get("/wish-list/approved/")
        self.assertEqual(len(approved_resp.data), 0)

        # Contact details are re-locked
        self.client.force_authenticate(user=self.requester)
        locked_resp = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertNotIn("WP_Contact", locked_resp.data)
        self.assertNotIn("Full_Address", locked_resp.data)
        self.assertFalse(locked_resp.data["can_view_sensitive_details"])

    def test_unsort_approved_profile_does_not_remove_from_approval_section(self):
        # 1. Requester shortlists partner and partner approves connection
        self.client.force_authenticate(user=self.requester)
        create_resp = self.client.post(
            "/wish-list/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        req_id = create_resp.data["id"]

        # Send connection request
        send_resp = self.client.patch(f"/wish-list/{req_id}/request/")
        self.assertEqual(send_resp.status_code, status.HTTP_200_OK)

        # Partner approves
        self.client.force_authenticate(user=self.partner)
        approve_resp = self.client.patch(
            f"/wish-list/{req_id}/respond/",
            {"Status": "Approved"},
            format="json",
        )
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)

        # Requester sees partner in shortlist and in approved
        self.client.force_authenticate(user=self.requester)
        shortlist_before = self.client.get("/wish-list/")
        self.assertEqual(len(shortlist_before.data), 1)
        approved_before = self.client.get("/wish-list/approved/")
        self.assertEqual(len(approved_before.data), 1)

        # 2. Requester "unsorts" partner (clicks heart / remove from shortlist)
        unsort_resp = self.client.delete(f"/wish-list/{req_id}/")
        self.assertEqual(unsort_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(unsort_resp.data["Status"], Wish_List.STATUS_APPROVED)
        self.assertFalse(unsort_resp.data["is_shortlisted"])

        # 3. Profile is REMOVED from shortlist:
        shortlist_after = self.client.get("/wish-list/")
        self.assertEqual(len(shortlist_after.data), 0)

        # 4. BUT profile is NOT REMOVED from approval section!
        approved_after = self.client.get("/wish-list/approved/")
        self.assertEqual(len(approved_after.data), 1)
        self.assertEqual(approved_after.data[0]["id"], req_id)

        # Partner also still sees requester in approved section
        self.client.force_authenticate(user=self.partner)
        partner_approved_after = self.client.get("/wish-list/approved/")
        self.assertEqual(len(partner_approved_after.data), 1)

        # Requester can STILL view partner's sensitive contact details
        self.client.force_authenticate(user=self.requester)
        contact_resp = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(contact_resp.data["WP_Contact"], "9000000002")

    def test_both_sides_can_remove_approval(self):
        # 1. Requester removes approval
        wish1 = Wish_List.objects.create(
            User_id=self.requester,
            Wish_User_id=self.partner,
            Status=Wish_List.STATUS_APPROVED,
        )
        partner_data = User_Data.objects.get(User_id=self.partner)
        partner_data.Accept_Profiles = [str(self.requester.pk)]
        partner_data.save()

        # Requester (User_id side) calls respond with disapproved / remove_approval
        self.client.force_authenticate(user=self.requester)
        revoke_resp1 = self.client.patch(
            f"/wish-list/{wish1.pk}/respond/",
            {"Status": "remove_approval"},
            format="json",
        )
        self.assertEqual(revoke_resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(revoke_resp1.data["Status"], Wish_List.STATUS_REJECTED)

        # Neither user sees connection in approved
        self.assertEqual(len(self.client.get("/wish-list/approved/").data), 0)
        self.client.force_authenticate(user=self.partner)
        self.assertEqual(len(self.client.get("/wish-list/approved/").data), 0)

        # 2. Partner (Wish_User_id side) removes approval
        partner2 = User.objects.create_user(
            username="partner2",
            password="SafePass123!",
            Contact="9000000003",
            Role="user",
        )
        partner2_data = User_Data.objects.create(
            User_id=partner2,
            WP_Contact="9000000003",
            Full_Address="Partner 2 address",
            Accept_Profiles=[str(self.requester.pk)],
        )
        wish2 = Wish_List.objects.create(
            User_id=self.requester,
            Wish_User_id=partner2,
            Status=Wish_List.STATUS_APPROVED,
        )

        self.client.force_authenticate(user=partner2)
        revoke_resp2 = self.client.delete(f"/wish-list/{wish2.pk}/?action=remove_approval")
        self.assertEqual(revoke_resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(revoke_resp2.data["Status"], Wish_List.STATUS_REJECTED)

        # Accept_Profiles cleaned up
        partner2_data.refresh_from_db()
        self.assertNotIn(str(self.requester.pk), partner2_data.Accept_Profiles or [])

    def test_delete_approved_connection_cleans_accept_profiles(self):
        # 1. Partner approves requester and has requester in Accept_Profiles
        wish = Wish_List.objects.create(
            User_id=self.requester,
            Wish_User_id=self.partner,
            Status=Wish_List.STATUS_APPROVED,
        )
        partner_data = User_Data.objects.get(User_id=self.partner)
        partner_data.Accept_Profiles = [str(self.requester.pk)]
        partner_data.save()

        # 2. Explicitly removing from approval cleans up Accept_Profiles on both sides
        self.client.force_authenticate(user=self.requester)
        del_resp = self.client.delete(f"/wish-list/{wish.pk}/?action=remove_approval")
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(del_resp.data["Status"], Wish_List.STATUS_REJECTED)

        # 3. Accept_Profiles is cleaned up
        partner_data.refresh_from_db()
        self.assertNotIn(str(self.requester.pk), partner_data.Accept_Profiles or [])

    def test_active_member_can_send_request_without_shortlisting(self):
        self.client.force_authenticate(user=self.requester)
        response = self.client.post(
            "/wish-list/request/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["Status"], Wish_List.STATUS_PENDING)

    def test_deactivated_profile_cannot_see_partner_contact_even_with_plan(self):
        # 1. Partner approves requester
        wish = Wish_List.objects.create(
            User_id=self.requester,
            Wish_User_id=self.partner,
            Status=Wish_List.STATUS_APPROVED,
        )

        # 2. Requester has active plan and profile is active -> can see contact
        self.client.force_authenticate(user=self.requester)
        resp = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["WP_Contact"], "9000000002")
        self.assertEqual(resp.data["Full_Address"], "Partner address")

        # 3. Requester deactivates own profile -> CANNOT see contact even with active plan
        requester_data = User_Data.objects.get(User_id=self.requester)
        requester_data.Active = False
        requester_data.save(update_fields=["Active"])

        resp_deactivated = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(resp_deactivated.status_code, status.HTTP_200_OK)
        self.assertNotIn("WP_Contact", resp_deactivated.data)
        self.assertNotIn("Full_Address", resp_deactivated.data)
        self.assertFalse(resp_deactivated.data["can_view_sensitive_details"])

        # 4. Deactivated profile CAN shortlist candidate
        shortlist_resp = self.client.post(
            "/wish-list/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        self.assertIn(shortlist_resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # 5. Deactivated profile CANNOT send connection request
        direct_req_resp = self.client.post(
            "/wish-list/request/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        self.assertEqual(direct_req_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("deactivated", direct_req_resp.data.get("detail", "").lower())

    def test_connection_request_email_notification(self):
        from unittest.mock import patch

        self.client.force_authenticate(user=self.requester)
        with patch("VMApp.views.notify_partner_request_async") as mock_notify:
            response = self.client.post(
                "/wish-list/request/",
                {"Wish_User_id": self.partner.pk},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            mock_notify.assert_called_once_with(self.requester.pk, self.partner.pk)

    def test_contact_relation_masked_and_updated(self):
        # Update partner with contact relation fields
        partner_data = User_Data.objects.get(User_id=self.partner)
        partner_data.WP_Contact = "9876543210"
        partner_data.WP_Contact_Relation = "Self"
        partner_data.Alt_Contact = "9876543211"
        partner_data.Alt_Contact_Relation = "Father"
        partner_data.Alt_Contact_Name = "Ramesh Kumar"
        partner_data.save()

        # Requester without approved connection cannot see contact relation fields
        self.client.force_authenticate(user=self.requester)
        resp_before = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(resp_before.status_code, status.HTTP_200_OK)
        self.assertNotIn("WP_Contact", resp_before.data)
        self.assertNotIn("WP_Contact_Relation", resp_before.data)
        self.assertNotIn("Alt_Contact", resp_before.data)
        self.assertNotIn("Alt_Contact_Relation", resp_before.data)

        # After approval, contact relation fields are revealed
        Wish_List.objects.create(
            User_id=self.requester,
            Wish_User_id=self.partner,
            Status=Wish_List.STATUS_APPROVED,
        )
        resp_after = self.client.get(f"/user-data/{self.partner.pk}/")
        self.assertEqual(resp_after.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_after.data["WP_Contact"], "9876543210")
        self.assertEqual(resp_after.data["WP_Contact_Relation"], "Self")
        self.assertEqual(resp_after.data["Alt_Contact"], "9876543211")
        self.assertEqual(resp_after.data["Alt_Contact_Relation"], "Father")
        self.assertEqual(resp_after.data["Alt_Contact_Name"], "Ramesh Kumar")

        # Test updating contact relation via API
        self.client.force_authenticate(user=self.partner)
        update_resp = self.client.put(
            f"/user-data/{self.partner.pk}/",
            {
                "WP_Contact": "9876543210",
                "wp_contact_relation": "Relative",
                "wp_contact_name": "Suresh Mama",
                "alt_contact_relation": "Mother",
            },
            format="json",
        )
        self.assertEqual(update_resp.status_code, status.HTTP_200_OK)
        partner_data.refresh_from_db()
        self.assertEqual(partner_data.WP_Contact_Relation, "Relative")
        self.assertEqual(partner_data.Wp_Contact_Name, "Suresh Mama")
        self.assertEqual(partner_data.Alt_Contact_Relation, "Mother")

    def test_user_data_pagination_10_to_15(self):
        # Create 20 candidates
        for i in range(20):
            u = User.objects.create_user(
                username=f"testcandidate_{i}",
                password="SafePass123!",
                Contact=f"911111{i:04d}",
                Role="user",
            )
            User_Data.objects.create(
                User_id=u,
                Full_Name=f"Candidate {i}",
                Active=True,
                Valid_Upto=timezone.localdate() + timedelta(days=30),
            )

        self.client.force_authenticate(user=self.requester)
        # Test default page_size 12
        resp_12 = self.client.get("/user-data/?page=1&page_size=12")
        self.assertEqual(resp_12.status_code, status.HTTP_200_OK)
        self.assertIn("results", resp_12.data)
        self.assertIn("count", resp_12.data)
        self.assertEqual(resp_12.data["page_size"], 12)
        self.assertEqual(len(resp_12.data["results"]), 12)

        # Test page_size 15
        resp_15 = self.client.get("/user-data/?page=1&page_size=15")
        self.assertEqual(resp_15.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_15.data["page_size"], 15)
        self.assertEqual(len(resp_15.data["results"]), 15)

        # Test page_size 10
        resp_10 = self.client.get("/user-data/?page=1&page_size=10")
        self.assertEqual(resp_10.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_10.data["page_size"], 10)
        self.assertEqual(len(resp_10.data["results"]), 10)

    def test_payment_atomic_transaction(self):
        from .models import Service_Data, Services, User_Transactions
        initial_balance = getattr(self.requester, "Amount", 0) or 0
        self.client.force_authenticate(user=self.requester)

        # Verify payment execution updates transaction, balance and validity atomically
        resp = self.client.post(
            "/verify-payment/",
            {
                "razorpay_order_id": "order_dummy_12345",
                "razorpay_payment_id": "pay_test_dummy_12345",
                "razorpay_signature": "dummy_test_success",
                "user_id": str(self.requester.pk),
                "plan": "Silver Plan",
                "amount": 500,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "Payment verified")

        self.requester.refresh_from_db()
        if hasattr(self.requester, "Amount"):
            self.assertEqual(self.requester.Amount, initial_balance + 500)

        txns = User_Transactions.objects.filter(User_id=self.requester, status="Success")
        self.assertTrue(txns.exists())

        req_data = User_Data.objects.get(User_id=self.requester)
        self.assertIsNotNone(req_data.Valid_Upto)


    def test_female_or_any_user_without_subscription_cannot_send_request_even_with_past_transactions(self):
        # Create a female candidate with no Valid_Upto (None)
        female_user = User.objects.create_user(
            username="female_cand",
            password="SafePassword123!",
            Contact="9998887776",
            Role="user",
        )
        female_data = User_Data.objects.create(
            User_id=female_user,
            Gender="Female",
            Full_Name="Female Candidate",
            Valid_Upto=None,  # No subscription!
            Active=True,
        )

        # Give her a historical success transaction in User_Transactions
        User_Transactions.objects.create(
            User_id=female_user,
            Plan="Gold",
            Amount=100,
            status="Success",
        )

        self.client.force_authenticate(user=female_user)

        # 1. She shortlists a partner profile (allowed without subscription)
        shortlist_resp = self.client.post(
            "/wish-list/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        self.assertIn(shortlist_resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        wish_id = shortlist_resp.data["id"]

        # 2. When she attempts to send connection request from wishlist, it MUST be rejected with 403 Forbidden!
        send_req_resp = self.client.patch(f"/wish-list/{wish_id}/request/")
        self.assertEqual(send_req_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("membership is required", send_req_resp.data["detail"])

        # 3. When she attempts direct profile request, it MUST also be rejected with 403 Forbidden!
        direct_resp = self.client.post(
            "/wish-list/request/",
            {"Wish_User_id": self.partner.pk},
            format="json",
        )
        self.assertEqual(direct_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("membership is required", direct_resp.data["detail"])

        # 4. Now activate her subscription (Valid_Upto = 30 days from today)
        female_data.Valid_Upto = timezone.localdate() + timedelta(days=30)
        female_data.save(update_fields=["Valid_Upto"])

        # 5. Now she can send connection request successfully!
        send_req_resp2 = self.client.patch(f"/wish-list/{wish_id}/request/")
        self.assertEqual(send_req_resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(send_req_resp2.data["Status"], Wish_List.STATUS_PENDING)


class HelpRoutingTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_test",
            password="SafePass123!",
            Contact="9990000001",
            Role="admin",
            Reference_Code=1001,
        )
        self.staff = User.objects.create_user(
            username="staff_test",
            password="SafePass123!",
            Contact="9990000002",
            Role="staff",
            Reference_Code=2002,
        )
        self.user_added_by_staff = User.objects.create_user(
            username="user_staff",
            password="SafePass123!",
            Contact="9990000003",
            Role="user",
            Refered_By=2002,
        )
        self.user_added_by_admin = User.objects.create_user(
            username="user_admin",
            password="SafePass123!",
            Contact="9990000004",
            Role="user",
            Refered_By=1001,
        )

    def test_support_targets_for_user_added_by_staff(self):
        self.client.force_authenticate(user=self.user_added_by_staff)
        resp = self.client.get("/help/?info=support_targets")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["has_staff"])
        self.assertEqual(resp.data["added_by_type"], "staff")
        self.assertEqual(str(resp.data["staff"]["id"]), str(self.staff.pk))

    def test_support_targets_for_user_added_by_admin(self):
        self.client.force_authenticate(user=self.user_added_by_admin)
        resp = self.client.get("/help/?info=support_targets")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["has_staff"])
        self.assertEqual(resp.data["added_by_type"], "admin")
        self.assertIsNone(resp.data["staff"])

    def test_help_creation_routes_to_staff_or_admin(self):
        # 1. User added by staff chooses staff
        self.client.force_authenticate(user=self.user_added_by_staff)
        staff_ticket_resp = self.client.post(
            "/help/",
            {"Question": "Help with profile verification", "target": "staff"},
            format="json",
        )
        self.assertEqual(staff_ticket_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(staff_ticket_resp.data["Role"], "staff")
        # Reply_By must remain None upon creation because no reply has been made yet
        self.assertIsNone(staff_ticket_resp.data["Reply_By"])
        self.assertEqual(str(staff_ticket_resp.data["Target_User"]), str(self.staff.pk))

        # Staff replies to ticket
        ticket_id = staff_ticket_resp.data["id"]
        self.client.force_authenticate(user=self.staff)
        reply_resp = self.client.patch(
            f"/help/{ticket_id}/",
            {"Answer": "We are verifying your documents now."},
            format="json",
        )
        self.assertEqual(reply_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(str(reply_resp.data["Reply_By"]), str(self.staff.pk))
        self.assertTrue(reply_resp.data["is_answered"])

        # 2. User added by staff chooses admin
        self.client.force_authenticate(user=self.user_added_by_staff)
        admin_ticket_resp = self.client.post(
            "/help/",
            {"Question": "Billing issue escalation", "target": "admin"},
            format="json",
        )
        self.assertEqual(admin_ticket_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(admin_ticket_resp.data["Role"], "admin")
        self.assertIsNone(admin_ticket_resp.data["Reply_By"])
        self.assertEqual(str(admin_ticket_resp.data["Target_User"]), str(self.admin.pk))

        # 3. User added by admin is ALWAYS assigned directly to admin (staff option rejected/forced to admin)
        self.client.force_authenticate(user=self.user_added_by_admin)
        direct_admin_resp = self.client.post(
            "/help/",
            {"Question": "General inquiry", "target": "staff"},  # Even if requested staff
            format="json",
        )
        self.assertEqual(direct_admin_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(direct_admin_resp.data["Role"], "admin")
        self.assertIsNone(direct_admin_resp.data["Reply_By"])
        self.assertEqual(str(direct_admin_resp.data["Target_User"]), str(self.admin.pk))

    def test_staff_inquiry_to_admin(self):
        # Staff asks question to admin
        self.client.force_authenticate(user=self.staff)
        staff_inquiry_resp = self.client.post(
            "/help/",
            {"Question": "Staff commission query", "Role": "staff"},
            format="json",
        )
        self.assertEqual(staff_inquiry_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(staff_inquiry_resp.data["Role"], "staff")
        # Reply_By must remain None upon creation because Admin has not replied yet!
        self.assertIsNone(staff_inquiry_resp.data["Reply_By"])
        self.assertEqual(str(staff_inquiry_resp.data["Target_User"]), str(self.admin.pk))

        # Admin replies to staff inquiry
        ticket_id = staff_inquiry_resp.data["id"]
        self.client.force_authenticate(user=self.admin)
        admin_reply_resp = self.client.patch(
            f"/help/{ticket_id}/",
            {"Answer": "We have processed your commission payout."},
            format="json",
        )
        self.assertEqual(admin_reply_resp.status_code, status.HTTP_200_OK)
        # Reply_By is now set to Admin
        self.assertEqual(str(admin_reply_resp.data["Reply_By"]), str(self.admin.pk))
        self.assertTrue(admin_reply_resp.data["is_answered"])


class StaffCommissionTests(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="9876543200",
            Contact="9876543200",
            Role="staff",
            Reference_Code=55555,
        )
        self.staff_profile = Staff_Data.objects.create(
            Staff_id=self.staff_user,
            Full_Name="Staff Member A",
            WP_Contact="9876543200",
            Amount=0,
            is_approved=True,
            Active=True,
        )
        # Create active commission rule of 250
        self.commission_rule = Staff_Commission.objects.create(
            Amount=250,
            Active=True,
        )
        self.candidate = User.objects.create_user(
            username="9123456780",
            Contact="9123456780",
            Role="user",
            Refered_By=55555,
        )

    def test_commission_awarded_on_user_profile_creation(self):
        self.client.force_authenticate(user=self.staff_user)

        # Staff adds matrimonial profile for candidate
        resp = self.client.post(
            "/user-data/",
            {
                "User_id": self.candidate.pk,
                "Full_Name": "Pooja Sharma",
                "Gender": "Female",
                "WP_Contact": "9123456780",
                "WP_Contact_Relation": "Self",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Check Staff_Data.Amount is updated with commission from Staff_Commission
        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 250)

        # Check transaction log is created
        txns = Staff_Transactions.objects.filter(
            Staff_id=self.staff_user,
            Type="Commission",
            Status="Success",
        )
        self.assertTrue(txns.exists())
        self.assertEqual(txns.first().Amount, 250)

        # Updating the same user profile should not double-award commission
        resp_update = self.client.post(
            "/user-data/",
            {
                "User_id": self.candidate.pk,
                "Full_Name": "Pooja Sharma Updated",
            },
            format="json",
        )
        self.assertEqual(resp_update.status_code, status.HTTP_200_OK)
        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 250)
        self.assertEqual(Staff_Transactions.objects.filter(Staff_id=self.staff_user, Type="Commission").count(), 1)

    def test_withdrawal_request_pending_and_admin_rejection_refunds(self):
        self.staff_profile.Amount = 500
        self.staff_profile.save()

        # 1. Staff requests withdrawal
        self.client.force_authenticate(user=self.staff_user)
        resp = self.client.post(
            "/staff-transactions/",
            {
                "Staff_id": self.staff_user.pk,
                "Amount": 200,
                "Type": "Withdrawal",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["remaining_amount"], 300)
        self.assertEqual(resp.data["Status"], "Pending")
        txn_id = resp.data["id"]

        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 300)

        # 2. Staff cannot approve/reject their own withdrawal
        resp_fail = self.client.patch(
            f"/staff-transactions/{txn_id}/",
            {"Status": "Approved"},
            format="json",
        )
        self.assertEqual(resp_fail.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin rejects the withdrawal -> amount refunded to staff account!
        admin_user = User.objects.create_user(
            username="admin_tx_reviewer",
            Role="admin",
        )
        self.client.force_authenticate(user=admin_user)
        resp_reject = self.client.patch(
            f"/staff-transactions/{txn_id}/",
            {
                "Status": "Rejected",
                "Msg": "Invalid bank IFSC details. Amount refunded to wallet.",
            },
            format="json",
        )
        self.assertEqual(resp_reject.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_reject.data["Status"], "Rejected")
        self.assertEqual(resp_reject.data["remaining_amount"], 500)

        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 500)

    def test_withdrawal_admin_approval_with_transaction_details(self):
        self.staff_profile.Amount = 1000
        self.staff_profile.save()

        # Staff requests withdrawal of 400
        self.client.force_authenticate(user=self.staff_user)
        resp = self.client.post(
            "/staff-transactions/",
            {
                "Staff_id": self.staff_user.pk,
                "Amount": 400,
                "Type": "Withdrawal",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        txn_id = resp.data["id"]

        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 600)

        # Admin approves withdrawal and provides transaction details (UTR/IMPS) in Msg
        admin_user = User.objects.create_user(
            username="admin_approver",
            Role="admin",
        )
        self.client.force_authenticate(user=admin_user)
        resp_approve = self.client.patch(
            f"/staff-transactions/{txn_id}/",
            {
                "Status": "Approved",
                "Msg": "IMPS Ref #9283748281 - Sent to HDFC A/C 9988",
            },
            format="json",
        )
        self.assertEqual(resp_approve.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_approve.data["Status"], "Approved")
        self.assertEqual(resp_approve.data["Msg"], "IMPS Ref #9283748281 - Sent to HDFC A/C 9988")
        # Amount remains deducted, not returned
        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_profile.Amount, 600)

    def test_registration_with_staff_referral_without_staff_data_uses_admin_referral(self):
        # Admin user with reference code
        admin_user = User.objects.create_user(
            username="admin_test",
            Role="admin",
            Reference_Code=999111,
        )

        # Staff user without any Staff_Data record
        staff_without_data = User.objects.create_user(
            username="staff_nodata",
            Role="staff",
            Reference_Code=888222,
        )

        # User attempts to register using this staff's referral code
        PhoneOTP.objects.create(phone="9876543210", otp="123456")
        resp = self.client.post(
            "/verify-otp/",
            {
                "Contact": "9876543210",
                "OTP": "123456",
                "password": "StrongPassword123!",
                "Refered_By": staff_without_data.Reference_Code,
                "Role": "user",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        registered_user = User.objects.get(Contact="9876543210")
        # Should fallback to admin referral code
        self.assertEqual(registered_user.Refered_By, admin_user.Reference_Code)
        # No balance should be added anywhere
        self.assertFalse(Staff_Transactions.objects.filter(Staff_id=staff_without_data).exists())

    def test_candidate_profile_when_staff_data_not_present_uses_admin_referral(self):
        admin_user = User.objects.create_user(
            username="admin_test2",
            Role="admin",
            Reference_Code=777111,
        )
        staff_without_data = User.objects.create_user(
            username="staff_nodata2",
            Role="staff",
            Reference_Code=666222,
        )
        candidate = User.objects.create_user(
            username="9888877777",
            Contact="9888877777",
            Role="user",
            Refered_By=666222,
        )
        self.client.force_authenticate(user=candidate)
        resp = self.client.post(
            "/user-data/",
            {
                "User_id": candidate.pk,
                "Full_Name": "Rohan Verma",
                "Gender": "Male",
                "WP_Contact": "9888877777",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        candidate.refresh_from_db()
        # Candidate's Refered_By should have fallen back to admin referral
        self.assertEqual(candidate.Refered_By, admin_user.Reference_Code)
        # No staff transactions should have been recorded
        self.assertFalse(Staff_Transactions.objects.filter(Staff_id=staff_without_data).exists())

    def test_user_data_filters_expired_and_inactive_profiles(self):
        """Ensure expired, inactive, or disabled candidate profiles are not returned in candidate search/pool."""
        today = timezone.localdate()
        viewer = User.objects.create_user(
            username="viewer_user",
            password="SafePass123!",
            Contact="9111111111",
            Role="user",
        )
        User_Data.objects.create(
            User_id=viewer,
            Full_Name="Viewer Candidate",
            Active=True,
            Valid_Upto=today + timedelta(days=30),
        )

        # 1. Valid Active Candidate
        valid_user = User.objects.create_user(
            username="valid_candidate",
            password="SafePass123!",
            Contact="9111111112",
            Role="user",
        )
        valid_profile = User_Data.objects.create(
            User_id=valid_user,
            Full_Name="Valid Candidate",
            Active=True,
            Valid_Upto=today + timedelta(days=10),
        )

        # 2. Expired Candidate
        expired_user = User.objects.create_user(
            username="expired_candidate",
            password="SafePass123!",
            Contact="9111111113",
            Role="user",
        )
        User_Data.objects.create(
            User_id=expired_user,
            Full_Name="Expired Candidate",
            Active=True,
            Valid_Upto=today - timedelta(days=1),
        )

        # 3. Deactivated Profile (Active=False)
        inactive_user = User.objects.create_user(
            username="inactive_candidate",
            password="SafePass123!",
            Contact="9111111114",
            Role="user",
        )
        User_Data.objects.create(
            User_id=inactive_user,
            Full_Name="Inactive Candidate",
            Active=False,
            Valid_Upto=today + timedelta(days=30),
        )

        # 4. Deactivated User Account (User.is_active=False)
        account_disabled_user = User.objects.create_user(
            username="disabled_account_user",
            password="SafePass123!",
            Contact="9111111115",
            Role="user",
            is_active=False,
        )
        User_Data.objects.create(
            User_id=account_disabled_user,
            Full_Name="Disabled Account Candidate",
            Active=True,
            Valid_Upto=today + timedelta(days=30),
        )

        # 5. Candidate with Valid_Upto = None (Null)
        null_valid_user = User.objects.create_user(
            username="null_valid_candidate",
            password="SafePass123!",
            Contact="9111111116",
            Role="user",
        )
        User_Data.objects.create(
            User_id=null_valid_user,
            Full_Name="Null Validity Candidate",
            Active=True,
            Valid_Upto=None,
        )

        # Viewer queries candidate pool
        self.client.force_authenticate(user=viewer)
        resp = self.client.get("/user-data/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        returned_user_ids = {str(item.get("User_id")) for item in resp.data}

        # Viewer can see themselves and the valid candidate
        self.assertIn(str(viewer.pk), returned_user_ids)
        self.assertIn(str(valid_user.pk), returned_user_ids)

        # Expired, inactive, and disabled candidates MUST NOT be returned
        self.assertNotIn(str(expired_user.pk), returned_user_ids)
        self.assertNotIn(str(inactive_user.pk), returned_user_ids)
        self.assertNotIn(str(account_disabled_user.pk), returned_user_ids)
        self.assertNotIn(str(null_valid_user.pk), returned_user_ids)

    def test_service_data_filters_expired_unapproved_and_inactive(self):
        """Ensure unapproved, inactive, and expired wedding services are excluded for non-admin viewers."""
        today = timezone.localdate()
        cat = Services.objects.create(
            Service_Name="Wedding DJ",
            Service_Type="DJ Services",
            Active=True,
        )

        provider = User.objects.create_user(
            username="service_vendor",
            password="SafePass123!",
            Contact="9222222222",
            Role="service",
        )

        # 1. Valid Live Service
        live_svc = Service_Data.objects.create(
            Service_id=provider,
            Service_Name="Royal DJ Beats",
            Service_Type="DJ Services",
            Active=True,
            Admin_Approval=True,
            Valid_Upto=today + timedelta(days=30),
        )

        # 2. Unapproved Service (Admin_Approval=False)
        unapproved_svc = Service_Data.objects.create(
            Service_id=provider,
            Service_Name="Pending Approval Beats",
            Service_Type="DJ Services",
            Active=True,
            Admin_Approval=False,
            Valid_Upto=today + timedelta(days=30),
        )

        # 3. Deactivated Service (Active=False)
        inactive_svc = Service_Data.objects.create(
            Service_id=provider,
            Service_Name="Inactive Beats",
            Service_Type="DJ Services",
            Active=False,
            Admin_Approval=True,
            Valid_Upto=today + timedelta(days=30),
        )

        # 4. Expired Service (Valid_Upto < today)
        expired_svc = Service_Data.objects.create(
            Service_id=provider,
            Service_Name="Expired Beats",
            Service_Type="DJ Services",
            Active=True,
            Admin_Approval=True,
            Valid_Upto=today - timedelta(days=1),
        )

        # Normal candidate user requests services
        candidate_viewer = User.objects.create_user(
            username="candidate_viewer",
            password="SafePass123!",
            Contact="9333333333",
            Role="user",
        )
        self.client.force_authenticate(user=candidate_viewer)

        resp = self.client.get("/service-data/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        returned_service_ids = {item.get("id") for item in resp.data}

        # ONLY live service should be returned
        self.assertIn(live_svc.id, returned_service_ids)
        self.assertNotIn(unapproved_svc.id, returned_service_ids)
        self.assertNotIn(inactive_svc.id, returned_service_ids)
        self.assertNotIn(expired_svc.id, returned_service_ids)

