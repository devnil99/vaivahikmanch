import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  FaHeart,
  FaShieldHalved,
  FaUserCheck,
  FaLock,
  FaHandshake,
  FaQuoteLeft,
  FaArrowRight,
  FaStar,
  FaCheck,
  FaMagnifyingGlass,
  FaLocationDot,
  FaBriefcase,
  FaGraduationCap,
  FaRegHeart,
  FaChevronDown,
} from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';

import coupleHeroImg from './wedding_couple_hero.jpg';
import coupleCardImg from './wedding_couple_card.jpg';
import { AdminGet, UserDataGetwt, User_StateGet, User_CasteGet, ProfessionGet } from '../Api/CoreApi';
import siteConfig from '../Config/Config';

function SearchableSelect({
  id,
  label,
  placeholder,
  value,
  onChange,
  options,
  specialFirstOption = null,
  emptyMessage = 'No matches found',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsTyping(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!isTyping || !query.trim()) return options;
    const term = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, query, isTyping]);

  const handleSelect = (val) => {
    onChange(val);
    setQuery('');
    setIsTyping(false);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsTyping(true);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputClickOrFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (specialFirstOption && query.toLowerCase().includes(specialFirstOption.value.toLowerCase())) {
        handleSelect(specialFirstOption.value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      setQuery('');
    }
  };

  const displayValue = isTyping ? query : (value || '');

  return (
    <div className="vm-combobox-wrapper" ref={wrapperRef}>
      <label className="vm-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="vm-combobox-input-wrap">
        <input
          id={id}
          type="text"
          className="vm-select vm-combobox-input"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClickOrFocus}
          onFocus={handleInputClickOrFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle dropdown"
          className="vm-combobox-arrow-btn"
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev;
              if (!next) {
                setQuery('');
                setIsTyping(false);
              }
              return next;
            });
          }}
        >
          <FaChevronDown className={`vm-combobox-arrow ${isOpen ? 'open' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <ul className="vm-combobox-dropdown" role="listbox">
          {specialFirstOption && (
            <li
              role="option"
              aria-selected={value === specialFirstOption.value}
              className={`vm-combobox-item special ${
                value === specialFirstOption.value ? 'selected' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(specialFirstOption.value);
              }}
            >
              <span className="vm-combobox-item-dot" />
              {specialFirstOption.label}
            </li>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={value === opt}
                className={`vm-combobox-item ${value === opt ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="vm-combobox-empty">{emptyMessage}</li>
          )}
        </ul>
      )}
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [backendStates, setBackendStates] = useState([]);
  const [backendCastes, setBackendCastes] = useState([]);
  const [backendProfessions, setBackendProfessions] = useState([]);

  const [lookingFor, setLookingFor] = useState('bride');
  const [minAge, setMinAge] = useState('21');
  const [maxAge, setMaxAge] = useState('30');
  const [community, setCommunity] = useState('');
  const [state, setState] = useState('');
  const [profession, setProfession] = useState('All Professions');
  const [hasSearched, setHasSearched] = useState(false);

  const ageOptions = useMemo(() => {
    return Array.from({ length: 43 }, (_, i) => String(18 + i)); // 18 to 60
  }, []);

  const handleMinAgeChange = (val) => {
    setMinAge(val);
    if (Number(val) > Number(maxAge)) {
      setMaxAge(val);
    }
  };

  const handleMaxAgeChange = (val) => {
    setMaxAge(val);
    if (Number(val) < Number(minAge)) {
      setMinAge(val);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const [adminRes, usersRes, statesRes, castesRes, profsRes] = await Promise.allSettled([
          AdminGet(),
          UserDataGetwt(),
          User_StateGet(),
          User_CasteGet(),
          ProfessionGet(),
        ]);

        if (!isMounted) return;

        if (adminRes.status === 'fulfilled' && Array.isArray(adminRes.value)) {
          const list = adminRes.value;
          const adminUsers = list.filter(
            (user) => user.Role === 'admin' || user.role === 'admin' || user.Role === 'superadmin'
          );
          setAdmin(adminUsers.length > 0 ? adminUsers : list);
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          setUsersData(usersRes.value);
        }

        if (statesRes.status === 'fulfilled' && Array.isArray(statesRes.value)) {
          setBackendStates(statesRes.value);
        }

        if (castesRes.status === 'fulfilled' && Array.isArray(castesRes.value)) {
          setBackendCastes(castesRes.value);
        }

        if (profsRes.status === 'fulfilled' && Array.isArray(profsRes.value)) {
          setBackendProfessions(profsRes.value);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  const adminRef = admin[0]?.Reference_Code || admin[0]?.refer || admin[0]?.reference_code;
  const registerUrl = adminRef ? `/UserRegister/${adminRef}` : '/UserRegister/';

  const isLoggedIn = Boolean(
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('user_id')
  );

  const handleConnect = (profile = null) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('user_id');

    if (token) {
      const role = (localStorage.getItem('role') || 'user').toLowerCase().trim();
      if (role === 'staff') {
        navigate('/StaffPanel');
      } else if (role === 'service') {
        navigate('/ServicePanel');
      } else {
        navigate('/UserPanel');
      }
    } else {
      navigate(registerUrl);
    }
  };

  const goToRegister = () => handleConnect();

  const handleQuickSearch = (event) => {
    event.preventDefault();

    if (!state || !state.trim()) {
      alert("Please select a State (कृपया राज्य चुनें)।");
      return;
    }

    if (!community || !community.trim()) {
      alert(`Please select a Caste / Community for ${state} (कृपया जाति चुनें)।`);
      return;
    }

    setHasSearched(true);

    setTimeout(() => {
      document
        .getElementById('profiles')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resetSearch = () => {
    setLookingFor('bride');
    setMinAge('21');
    setMaxAge('30');
    const firstState = availableStates[0] || '';
    setState(firstState);
    setProfession('All Professions');
    setHasSearched(false);

    document
      .getElementById('home')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  // Map states strictly from backend States_With_Districts model (backendStates) and Caste records with states
  const availableStates = useMemo(() => {
    const statesSet = new Set();

    if (Array.isArray(backendStates)) {
      backendStates.forEach((item) => {
        // Exclude deactivated state records
        if (item?.Active === false || item?.active === false) return;
        const s = String(item?.status || item?.Status || '').trim().toLowerCase();
        if (s === 'deactive' || s === 'inactive' || s === 'deactivated' || s === 'disabled') return;

        const st = item?.State || item?.state || item?.State_Name;
        if (typeof st === 'string' && st.trim() && st.trim().toLowerCase() !== 'all india' && st.trim().toLowerCase() !== 'all') {
          statesSet.add(st.trim());
        }
      });
    }

    if (Array.isArray(backendCastes)) {
      backendCastes.forEach((item) => {
        // Exclude deactivated records
        if (item?.Active === false || item?.active === false) return;
        const s = String(item?.status || item?.Status || '').trim().toLowerCase();
        if (s === 'deactive' || s === 'inactive' || s === 'deactivated' || s === 'disabled') return;

        const st = item?.State || item?.state;
        if (typeof st === 'string' && st.trim() && st.trim().toLowerCase() !== 'all india' && st.trim().toLowerCase() !== 'all') {
          statesSet.add(st.trim());
        }
      });
    }

    return Array.from(statesSet).sort((a, b) => a.localeCompare(b));
  }, [backendStates, backendCastes]);

  // Initialize selected state from backend states once loaded
  useEffect(() => {
    if (availableStates.length > 0) {
      if (!state || !availableStates.includes(state)) {
        setState(availableStates[0]);
      }
    }
  }, [availableStates, state]);

  // Fetch castes strictly from backend for the selected state
  useEffect(() => {
    if (state && state.trim()) {
      User_CasteGet({ state: state.trim() }).then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setBackendCastes((prev) => {
            const others = prev.filter(
              (c) => String(c.State || c.state || '').trim().toLowerCase() !== state.trim().toLowerCase()
            );
            return [...others, ...res];
          });
        }
      }).catch(() => {});
    }
  }, [state]);

  // Map castes strictly based on the selected state from backend Caste model
  const availableCastes = useMemo(() => {
    if (!state) return [];
    const casteSet = new Set();
    const normSelectedState = state.trim().toLowerCase();

    if (Array.isArray(backendCastes)) {
      backendCastes.forEach((item) => {
        // Exclude deactivated records
        if (item?.Active === false || item?.active === false) return;
        const s = String(item?.status || item?.Status || '').trim().toLowerCase();
        if (s === 'deactive' || s === 'inactive' || s === 'deactivated' || s === 'disabled') return;

        const itemState = String(item?.State || item?.state || '').trim().toLowerCase();
        // Strictly map castes for the selected state from backend Caste model
        if (itemState && itemState === normSelectedState) {
          if (Array.isArray(item?.Caste_Name)) {
            item.Caste_Name.forEach((c) => {
              if (typeof c === 'string' && c.trim()) casteSet.add(c.trim());
            });
          } else if (typeof item?.Caste_Name === 'string' && item.Caste_Name.trim()) {
            casteSet.add(item.Caste_Name.trim());
          }

          if (typeof item?.caste === 'string' && item.caste.trim()) {
            casteSet.add(item.caste.trim());
          }
        }
      });
    }

    return Array.from(casteSet).sort((a, b) => a.localeCompare(b));
  }, [backendCastes, state]);

  // Handle State selection change: update state and immediately map to first caste of the selected state
  const handleStateChange = (newState) => {
    setState(newState);
    if (!newState) {
      setCommunity('');
      return;
    }
    const norm = newState.trim().toLowerCase();
    const mapped = [];
    if (Array.isArray(backendCastes)) {
      backendCastes.forEach((item) => {
        if (item?.Active === false || item?.active === false) return;
        const itemState = String(item?.State || item?.state || '').trim().toLowerCase();
        if (itemState === norm) {
          if (Array.isArray(item?.Caste_Name)) {
            item.Caste_Name.forEach((c) => {
              if (typeof c === 'string' && c.trim()) mapped.push(c.trim());
            });
          } else if (typeof item?.Caste_Name === 'string' && item.Caste_Name.trim()) {
            mapped.push(item.Caste_Name.trim());
          }
        }
      });
    }
    const sorted = Array.from(new Set(mapped)).sort((a, b) => a.localeCompare(b));
    if (sorted.length > 0) {
      setCommunity(sorted[0]);
    } else {
      setCommunity('');
    }
  };

  // When availableCastes updates for the selected state, auto-select first caste of that state
  useEffect(() => {
    if (availableCastes.length > 0) {
      if (!community || !availableCastes.includes(community)) {
        setCommunity(availableCastes[0]);
      }
    } else {
      setCommunity('');
    }
  }, [availableCastes]);

  // Map professions dynamically from backend Profession model + candidates
  const availableProfessions = useMemo(() => {
    const profSet = new Set();

    if (Array.isArray(backendProfessions)) {
      backendProfessions.forEach((item) => {
        if (item?.Active === false || item?.active === false) return;
        const p =
          item?.Profession_Name ||
          item?.profession_name ||
          item?.name ||
          item?.Profession ||
          item?.profession;
        if (typeof p === 'string' && p.trim()) {
          profSet.add(p.trim());
        }
      });
    }

    if (Array.isArray(usersData)) {
      usersData.forEach((u) => {
        const p = u?.Profession || u?.profession;
        if (typeof p === 'string' && p.trim()) {
          profSet.add(p.trim());
        }
      });
    }

    if (profSet.size === 0) {
      [
        'Software Engineer / IT',
        'Govt. Employee / Civil Services',
        'Doctor / Healthcare',
        'Business / Entrepreneur',
        'Banking / Finance / CA',
        'Teacher / Professor',
        'Private Sector / Corporate',
        'Lawyer / Legal',
        'Civil / Mechanical Engineer',
      ].forEach((p) => profSet.add(p));
    }

    return Array.from(profSet).sort((a, b) => a.localeCompare(b));
  }, [backendProfessions, usersData]);

  // Demo profiles. Connect your backend API to display real registered users.
  const demoProfiles = useMemo(() => [
    {
      id: 1,
      name: 'Pooja Verma',
      gender: 'bride',
      age: 26,
      height: "5'4\"",
      caste: 'Brahmin',
      education: 'B.Tech',
      profession: 'Software Engineer',
      city: 'Raipur',
      state: 'Chhattisgarh',
      avatar: '👩‍💼',
    },
    {
      id: 2,
      name: 'Aniket Sharma',
      gender: 'groom',
      age: 29,
      height: "5'10\"",
      caste: 'Rajput',
      education: 'MBA',
      profession: 'Banking Manager',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      avatar: '👨‍💼',
    },
    {
      id: 3,
      name: 'Divya Sahu',
      gender: 'bride',
      age: 25,
      height: "5'3\"",
      caste: 'Sahu',
      education: 'MBBS',
      profession: 'Doctor',
      city: 'Bilaspur',
      state: 'Chhattisgarh',
      avatar: '👩‍⚕️',
    },
    {
      id: 4,
      name: 'Rahul Agarwal',
      gender: 'groom',
      age: 30,
      height: "5'9\"",
      caste: 'Agarwal',
      education: 'CA',
      profession: 'Chartered Accountant',
      city: 'Indore',
      state: 'Madhya Pradesh',
      avatar: '👨‍💻',
    },
    {
      id: 5,
      name: 'Neha Verma',
      gender: 'bride',
      age: 27,
      height: "5'5\"",
      caste: 'Kurmi / Verma',
      education: 'MCA',
      profession: 'Software Developer',
      city: 'Durg',
      state: 'Chhattisgarh',
      avatar: '👩‍💻',
    },
    {
      id: 6,
      name: 'Amit Yadav',
      gender: 'groom',
      age: 28,
      height: "5'8\"",
      caste: 'Yadav',
      education: 'B.Tech',
      profession: 'IT Professional',
      city: 'Jabalpur',
      state: 'Madhya Pradesh',
      avatar: '👨‍💻',
    },
    {
      id: 7,
      name: 'Priya Jain',
      gender: 'bride',
      age: 24,
      height: "5'3\"",
      caste: 'Jain',
      education: 'MBA',
      profession: 'HR Executive',
      city: 'Mumbai',
      state: 'Maharashtra',
      avatar: '👩‍💼',
    },
    {
      id: 8,
      name: 'Vikash Sahu',
      gender: 'groom',
      age: 27,
      height: "5'9\"",
      caste: 'Sahu',
      education: 'M.Tech',
      profession: 'Engineer',
      city: 'Raipur',
      state: 'Chhattisgarh',
      avatar: '👨‍🔧',
    },
    {
      id: 9,
      name: 'Anjali Gupta',
      gender: 'bride',
      age: 28,
      height: "5'4\"",
      caste: 'Gupta',
      education: 'M.Com',
      profession: 'Accountant',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      avatar: '👩‍💼',
    },
    {
      id: 10,
      name: 'Rohit Sharma',
      gender: 'groom',
      age: 26,
      height: "5'10\"",
      caste: 'Brahmin',
      education: 'B.Tech',
      profession: 'Software Engineer',
      city: 'Pune',
      state: 'Maharashtra',
      avatar: '👨‍💻',
    },
    {
      id: 11,
      name: 'Sneha Patel',
      gender: 'bride',
      age: 25,
      height: "5'2\"",
      caste: 'Kurmi / Verma',
      education: 'B.Sc',
      profession: 'Teacher',
      city: 'Bilaspur',
      state: 'Chhattisgarh',
      avatar: '👩‍🏫',
    },
    {
      id: 12,
      name: 'Karan Jain',
      gender: 'groom',
      age: 30,
      height: "5'11\"",
      caste: 'Jain',
      education: 'MBA',
      profession: 'Business Manager',
      city: 'Mumbai',
      state: 'Maharashtra',
      avatar: '👨‍💼',
    },
  ], []);

  const backendProfiles = useMemo(() => {
    const apiBase = (siteConfig?.apiBaseURL || siteConfig?.default?.apiBaseURL || 'https://vaivahikmanch.in').replace(/\/+$/, '');
    const todayStr = new Date().toISOString().split('T')[0];
    return (usersData || [])
      .filter((u) => {
        if (!u || (!u.Full_Name && !u.Gender && !u.Age)) return false;
        // 1. Exclude deactivated / inactive profiles
        if (u.Active === false || u.active === false || u.is_active === false) return false;
        if (u.user_account && u.user_account.is_active === false) return false;
        const s = String(u.status || u.Status || '').trim().toLowerCase();
        if (s === 'deactive' || s === 'inactive' || s === 'deactivated' || s === 'disabled') return false;

        // 2. Exclude admin approval pending profiles
        if (u.is_approved === false || u.Admin_Approval === false) return false;
        if (s === 'pending') return false;

        // 3. Strictly exclude Null or expired Valid_Upto
        if (!u.Valid_Upto) return false;
        const vu = String(u.Valid_Upto).trim().split('T')[0];
        if (!vu || vu < todayStr) return false;

        return true;
      })
      .map((u) => {
        const rawGender = String(u.Gender || '').trim().toLowerCase();
        const isBride =
          rawGender.includes('female') ||
          rawGender === 'bride' ||
          rawGender === 'f' ||
          rawGender === 'woman' ||
          rawGender === 'girl';
        const gender = isBride ? 'bride' : 'groom';

        const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";
        const getMediaUrl = (path, fallback = "") => {
          if (!path) return fallback;
          if (typeof path !== "string") return fallback;
          const trimmed = path.trim();
          if (!trimmed) return fallback;
          if (trimmed.startsWith("data:")) return trimmed;
          const localMatch = trimmed.match(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/(?:media\/)?(.*)$/i);
          if (localMatch && localMatch[1]) {
            return `${S3_MEDIA_BASE_URL}${localMatch[1].replace(/^\/+/, "")}`;
          }
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
          const cleanPath = trimmed.replace(/^\/+/, "").replace(/^media\//, "");
          return `${S3_MEDIA_BASE_URL}${cleanPath}`;
        };

        let profilePicUrl = u.Profile_Pic ? getMediaUrl(u.Profile_Pic) : null;

        const heightVal = u.Height
          ? (String(u.Height).includes("'") ? u.Height : `${u.Height} cm`)
          : (gender === 'bride' ? "5'3\"" : "5'9\"");

        let calculatedAge = null;
        if (u.Age && !isNaN(Number(u.Age)) && Number(u.Age) > 0) {
          calculatedAge = Number(u.Age);
        } else if (u.DOB) {
          let dobStr = String(u.DOB).trim();
          let birthDate = new Date(dobStr);
          if (isNaN(birthDate.getTime()) && dobStr.includes('/')) {
            const parts = dobStr.split('/');
            if (parts.length === 3) {
              birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }
          if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            if (age > 0) calculatedAge = age;
          }
        }
        const profileAge = calculatedAge || (gender === 'bride' ? 25 : 28);

        return {
          id: `db-${u.id || u.User_id || Math.random()}`,
          name: u.Full_Name || (gender === 'bride' ? 'Bride Member' : 'Groom Member'),
          gender,
          age: profileAge,
          height: heightVal,
          caste: u.Caste || 'Community Member',
          education: u.Qualification || 'Graduate',
          profession: u.Profession || 'Professional',
          city: u.City || u.District || 'Raipur',
          state: u.State || 'Chhattisgarh',
          avatar: gender === 'bride' ? '👩‍💼' : '👨‍💼',
          profilePic: profilePicUrl,
          isReal: true,
        };
      });
  }, [usersData]);

  const filteredProfiles = useMemo(() => {
    const combinedProfiles = [...backendProfiles, ...demoProfiles];

    return combinedProfiles
      .filter((profile) => {
        const matchesGender = profile.gender === lookingFor;

        const minA = Number(minAge) || 18;
        const maxA = Number(maxAge) || 60;
        const lowerAge = Math.min(minA, maxA);
        const upperAge = Math.max(minA, maxA);
        const pAge = Number(profile.age);

        const matchesAge = !isNaN(pAge) ? (pAge >= lowerAge && pAge <= upperAge) : true;

        const matchesState = Boolean(
          state &&
          String(profile.state || '').trim().toLowerCase() === state.trim().toLowerCase()
        );

        const pCaste = String(profile.caste || '').toLowerCase();
        const selCommunity = String(community || '').toLowerCase();

        const matchesCommunity = Boolean(
          selCommunity && (
            pCaste === selCommunity ||
            pCaste.includes(selCommunity) ||
            selCommunity.includes(pCaste) ||
            ((selCommunity.includes('kurmi') || selCommunity.includes('verma')) &&
              (pCaste.includes('kurmi') || pCaste.includes('verma'))) ||
            ((selCommunity.includes('bramhin') || selCommunity.includes('brahmin')) &&
              (pCaste.includes('bramhin') || pCaste.includes('brahmin')))
          )
        );

        const pProf = String(profile.profession || '').toLowerCase();
        const selProf = String(profession || '').toLowerCase();
        const isAllProf =
          !profession ||
          profession === 'All' ||
          selProf === 'all' ||
          selProf === 'all professions' ||
          selProf === 'any';

        const matchesProfession =
          isAllProf ||
          pProf.includes(selProf) ||
          selProf.includes(pProf) ||
          (selProf.includes('software') && (pProf.includes('software') || pProf.includes('developer') || pProf.includes('engineer') || pProf.includes('it'))) ||
          (selProf.includes('doctor') && (pProf.includes('doctor') || pProf.includes('medical') || pProf.includes('mbbs'))) ||
          (selProf.includes('govt') && (pProf.includes('govt') || pProf.includes('civil') || pProf.includes('officer')));

        return (
          matchesGender &&
          matchesAge &&
          matchesState &&
          matchesCommunity &&
          matchesProfession
        );
      })
      .slice(0, 18);
  }, [backendProfiles, demoProfiles, lookingFor, minAge, maxAge, state, community, profession]);

  const steps = [
    {
      number: '01',
      icon: '👤',
      title: 'Create Your Profile',
      description:
        'Share your interests, education, family background, and partner preferences.',
    },
    {
      number: '02',
      icon: '💞',
      title: 'Discover Your Match',
      description:
        'Explore compatible profiles and connect with people who share your values.',
    },
    {
      number: '03',
      icon: '💍',
      title: 'Build Your Future',
      description:
        'Get to know each other, involve your families, and begin your next chapter.',
    },
  ];

  const features = [
    {
      icon: <FaUserCheck />,
      title: 'Profile Verification',
      description:
        'Verification features can help members assess profile authenticity and build trust.',
    },
    {
      icon: <FaLock />,
      title: 'Privacy Matters',
      description:
        'Manage your profile information thoughtfully and follow safe communication practices.',
    },
    {
      icon: <FaHandshake />,
      title: 'Family Values',
      description:
        'Explore connections based on education, community, preferences, and shared values.',
    },
    {
      icon: <FaShieldHalved />,
      title: 'Safety First',
      description:
        'Take your time, verify important details, and make informed decisions about new connections.',
    },
  ];

  const stories = [
    {
      couple: 'Siddharth & Ananya',
      city: 'Bhopal, Madhya Pradesh',
      quote:
        'We wanted a partner who shared our values. Connecting with families helped us take the next step with confidence.',
    },
    {
      couple: 'Manish & Pooja',
      city: 'Bilaspur, Chhattisgarh',
      quote:
        'Finding someone compatible with our family values was important to us. We appreciated having a place to explore connections.',
    },
    {
      couple: 'Vikram & Shreya',
      city: 'Raipur, Chhattisgarh',
      quote:
        'Our search was about finding a genuine connection and a person with whom we could build a future together.',
    },
  ];

  return (
    <>
      <style>{`
        .vm-home {
          --red: #e11d48;
          --deep-red: #9f1239;
          --mid-red: #be123c;
          --pink: #db2777;
          --light-pink: #fff1f2;
          --pale-pink: #fff8fa;
          --border-pink: #fecdd3;
          --text: #4c0519;
          --muted: #775563;
          width: 100%;
          min-height: 100vh;
          margin: 0;
          background: var(--pale-pink);
          color: var(--text);
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          overflow-x: clip;
        }

        .vm-home *,
        .vm-home *::before,
        .vm-home *::after {
          box-sizing: border-box;
        }

        .vm-home img {
          max-width: 100%;
        }

        .vm-container {
          width: min(1320px, calc(100% - 64px));
          margin-inline: auto;
        }

        .vm-section {
          padding: 82px 0;
          scroll-margin-top: 80px;
        }

        .vm-white {
          background: #fff;
        }

        .vm-pink-bg {
          background: linear-gradient(180deg, #fff1f4, #fff8fa);
        }

        .vm-heading-center {
          max-width: 760px;
          margin: 0 auto 46px;
          text-align: center;
        }

        .vm-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--red);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .vm-section-title {
          margin: 12px 0;
          color: var(--deep-red);
          font-size: clamp(28px, 3.2vw, 43px);
          font-weight: 900;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .vm-section-desc {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.85;
          margin: 0;
        }

        .vm-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 13px 25px;
          border-radius: 30px;
          border: 1px solid transparent;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease,
            background .25s ease;
        }

        .vm-button:hover {
          transform: translateY(-2px);
        }

        .vm-button-primary {
          background: linear-gradient(135deg, #e11d48, #db2777, #9f1239);
          color: #fff;
          box-shadow: 0 8px 24px rgba(190, 18, 60, .23);
        }

        .vm-button-primary:hover {
          color: #fff;
          box-shadow: 0 12px 30px rgba(190, 18, 60, .34);
        }

        .vm-button-outline {
          background: #fff;
          color: var(--mid-red);
          border-color: var(--red);
        }

        .vm-button-outline:hover {
          background: var(--light-pink);
          color: var(--deep-red);
        }

        .vm-hero {
          position: relative;
          padding: 66px 0 78px;
          background:
            radial-gradient(ellipse at 95% 8%, #ffdce7 0, transparent 33%),
            radial-gradient(ellipse at 5% 100%, #ffe4ed 0, transparent 32%),
            linear-gradient(180deg, #fff9fb, #fff0f4);
        }

        .vm-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
          align-items: center;
          gap: clamp(30px, 4vw, 65px);
        }

        .vm-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 22px;
          padding: 10px 17px;
          border: 1px solid var(--border-pink);
          border-radius: 30px;
          background: rgba(255,255,255,.88);
          color: var(--deep-red);
          font-size: 12px;
          font-weight: 800;
        }

        .vm-hero-badge svg {
          color: var(--red);
        }

        .vm-hero-title {
          margin: 0 0 20px;
          color: var(--deep-red);
          font-size: clamp(38px, 4.4vw, 62px);
          font-weight: 900;
          letter-spacing: -1.6px;
          line-height: 1.12;
          overflow-wrap: anywhere;
        }

        .vm-hero-title span {
          color: var(--red);
        }

        .vm-hero-description {
          max-width: 640px;
          margin: 0 0 28px;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.9;
        }

        .vm-search-card {
          padding: clamp(20px, 2.2vw, 30px);
          border: 1px solid #f6c4d1;
          border-radius: 26px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 16px 45px rgba(159,18,57,.10);
        }

        .vm-search-title {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 22px;
          color: var(--deep-red);
          font-size: 18px;
          font-weight: 900;
        }

        .vm-search-title svg {
          color: var(--red);
        }

        .vm-field-label {
          display: block;
          margin-bottom: 8px;
          color: var(--text);
          font-size: 12px;
          font-weight: 800;
        }

        .vm-toggle-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 21px;
        }

        .vm-toggle {
          min-width: 0;
          min-height: 46px;
          padding: 11px 8px;
          border: 1px solid var(--border-pink);
          border-radius: 13px;
          background: #fff8fa;
          color: var(--muted);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all .2s ease;
        }

        .vm-toggle.active {
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 5px 14px rgba(190,18,60,.2);
        }

        .vm-filter-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 21px;
        }

        .vm-select {
          width: 100%;
          min-width: 0;
          min-height: 46px;
          padding: 11px 12px;
          border: 1px solid #f0bac8;
          border-radius: 12px;
          outline: none;
          background: #fff;
          color: var(--text);
          font-size: 13px;
        }

        .vm-select:focus {
          border-color: var(--red);
          box-shadow: 0 0 0 3px rgba(225,29,72,.1);
        }

        .vm-combobox-wrapper {
          position: relative;
          width: 100%;
        }

        .vm-combobox-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .vm-combobox-input {
          padding-right: 36px !important;
          cursor: pointer;
        }

        .vm-combobox-input:focus {
          cursor: text;
        }

        .vm-combobox-arrow-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 0;
          color: #9f1239;
          cursor: pointer;
        }

        .vm-combobox-arrow {
          font-size: 12px;
          transition: transform .2s ease;
        }

        .vm-combobox-arrow.open {
          transform: rotate(180deg);
        }

        .vm-combobox-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          z-index: 9999;
          max-height: 250px;
          overflow-y: auto;
          margin: 0;
          padding: 6px;
          list-style: none;
          background: #ffffff;
          border: 1px solid #f6c4d1;
          border-radius: 14px;
          box-shadow: 0 16px 36px rgba(159, 18, 60, 0.16);
          animation: vmDropdownFadeIn 0.15s ease-out;
        }

        @keyframes vmDropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .vm-combobox-item {
          padding: 9px 12px;
          border-radius: 8px;
          color: var(--text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vm-combobox-item:hover {
          background: #ffeef2;
          color: var(--deep-red);
          font-weight: 600;
        }

        .vm-combobox-item.selected {
          background: #ffe4ea;
          color: var(--red);
          font-weight: 700;
        }

        .vm-combobox-item.special {
          border-bottom: 1px dashed #fce7ed;
          margin-bottom: 4px;
          font-weight: 700;
          color: var(--deep-red);
        }

        .vm-combobox-item-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--red);
          display: inline-block;
        }

        .vm-combobox-empty {
          padding: 12px;
          text-align: center;
          color: var(--muted);
          font-size: 12px;
          font-style: italic;
        }

        .vm-search-submit {
          width: 100%;
          min-height: 51px;
        }

        .vm-trust-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          margin-top: 21px;
          padding-top: 17px;
          border-top: 1px solid #ffe4ea;
        }

        .vm-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--muted);
          font-size: 11px;
        }

        .vm-trust-item svg {
          color: #16a34a;
        }

        .vm-hero-visual {
          position: relative;
          min-width: 0;
          padding: 10px;
        }

        .vm-hero-image-wrap {
          position: relative;
          overflow: hidden;
          border: 5px solid #fff;
          border-radius: 32px;
          background: #fce7f3;
          box-shadow: 0 25px 60px rgba(159,18,57,.2);
        }

        .vm-hero-image {
          display: block;
          width: 100%;
          height: clamp(400px, 43vw, 620px);
          object-fit: cover;
          object-position: center;
        }

        .vm-image-overlay {
          position: absolute;
          inset: auto 0 0;
          padding: 65px 25px 25px;
          color: #fff;
          background: linear-gradient(
            to top,
            rgba(76,5,25,.95),
            rgba(159,18,57,.32),
            transparent
          );
        }

        .vm-image-overlay small {
          color: #fecdd3;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .vm-image-overlay h3 {
          margin: 8px 0 0;
          color: #fff;
          font-size: clamp(19px, 2vw, 27px);
          line-height: 1.4;
        }

        .vm-chip-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .vm-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 17px;
          border: 1px solid #f5bfcd;
          border-radius: 30px;
          background: #fff;
          color: var(--deep-red);
          text-align: center;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all .2s ease;
        }

        .vm-chip:hover {
          transform: translateY(-2px);
          border-color: transparent;
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #fff;
          box-shadow: 0 6px 16px rgba(190,18,60,.18);
        }

        .vm-profile-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 23px;
        }

        .vm-profile-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #f5cfda;
          border-radius: 23px;
          background: #fff;
          box-shadow: 0 9px 28px rgba(159,18,57,.06);
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .vm-profile-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 35px rgba(159,18,57,.14);
        }

        .vm-profile-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 175px;
          background: linear-gradient(135deg, #fff1f2, #fbcfe0);
          font-size: 67px;
          overflow: hidden;
        }

        .vm-profile-badge {
          position: absolute;
          top: 12px;
          right: 10px;
          padding: 6px 9px;
          border-radius: 20px;
          background: #fff;
          color: var(--deep-red);
          font-size: 10px;
          font-weight: 800;
          z-index: 2;
        }

        .vm-profile-badge.real {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
        }

        .vm-profile-body {
          padding: 20px;
        }

        .vm-profile-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 16px;
        }

        .vm-profile-name {
          margin: 0;
          color: var(--deep-red);
          font-size: 19px;
          font-weight: 900;
        }

        .vm-profile-community {
          color: var(--red);
          font-size: 10px;
          font-weight: 800;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .vm-profile-detail {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 12px 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .vm-profile-detail svg {
          flex-shrink: 0;
          margin-top: 3px;
          color: var(--red);
        }

        .vm-profile-link {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          width: 100%;
          margin-top: 18px;
          padding: 12px 9px;
          border: 1px solid #f4b9ca;
          border-radius: 25px;
          background: #fff1f2;
          color: var(--deep-red);
          text-align: center;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all .2s ease;
        }

        .vm-profile-link:hover {
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #fff;
        }

        .vm-center-action {
          margin-top: 36px;
          text-align: center;
        }

        .vm-spotlight-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: clamp(28px, 4vw, 60px);
          padding: clamp(22px, 3vw, 44px);
          border: 1px solid #f3c4d0;
          border-radius: 30px;
          background: #fff;
          box-shadow: 0 18px 50px rgba(159,18,57,.08);
        }

        .vm-spotlight-image-wrap {
          position: relative;
          overflow: hidden;
          border: 3px solid #ffe4ea;
          border-radius: 25px;
        }

        .vm-spotlight-image {
          display: block;
          width: 100%;
          height: clamp(300px, 35vw, 480px);
          object-fit: cover;
        }

        .vm-spotlight-badge {
          position: absolute;
          right: 12px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 15px;
          border-radius: 17px;
          background: linear-gradient(135deg, #e11d48, #9f1239);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 8px 22px rgba(159,18,57,.25);
        }

        .vm-spotlight-badge svg {
          color: #fecdd3;
          font-size: 20px;
        }

        .vm-spotlight-title {
          margin: 13px 0 17px;
          color: var(--deep-red);
          font-size: clamp(27px, 3vw, 42px);
          font-weight: 900;
          line-height: 1.25;
        }

        .vm-spotlight-description {
          margin-bottom: 22px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.9;
        }

        .vm-spotlight-caption {
          margin-bottom: 23px;
          color: var(--deep-red);
          font-size: 13px;
          font-weight: 800;
        }

        .vm-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .vm-step-card {
          padding: 35px 27px;
          border: 1px solid #f4c7d3;
          border-radius: 24px;
          background: #fff8fa;
          text-align: center;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .vm-step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(159,18,57,.1);
        }

        .vm-step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e11d48, #db2777, #9f1239);
          color: #fff;
          font-size: 17px;
          font-weight: 900;
          box-shadow: 0 7px 18px rgba(190,18,60,.2);
        }

        .vm-step-emoji {
          margin-bottom: 12px;
          font-size: 28px;
        }

        .vm-card-title {
          margin: 0 0 12px;
          color: var(--deep-red);
          font-size: 19px;
          font-weight: 900;
        }

        .vm-card-description {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.85;
        }

        .vm-feature-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .vm-feature-card {
          padding: 28px 23px;
          border: 1px solid #f4c7d3;
          border-radius: 23px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(159,18,57,.04);
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .vm-feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 13px 28px rgba(159,18,57,.1);
        }

        .vm-feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 53px;
          height: 53px;
          margin-bottom: 19px;
          border: 1px solid #fecdd3;
          border-radius: 16px;
          background: #fff1f2;
          color: var(--red);
          font-size: 23px;
        }

        .vm-story-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .vm-story-card {
          padding: 29px;
          border: 1px solid #f4c7d3;
          border-radius: 24px;
          background: #fff8fa;
          box-shadow: 0 9px 26px rgba(159,18,57,.05);
        }

        .vm-story-quote-icon {
          margin-bottom: 15px;
          color: var(--red);
          font-size: 24px;
        }

        .vm-story-quote {
          min-height: 105px;
          margin: 0 0 22px;
          color: var(--muted);
          font-size: 13px;
          font-style: italic;
          line-height: 1.9;
        }

        .vm-story-divider {
          height: 1px;
          margin-bottom: 16px;
          background: #f5c6d2;
        }

        .vm-story-name {
          color: var(--deep-red);
          font-size: 16px;
          font-weight: 900;
        }

        .vm-story-city {
          margin-top: 5px;
          color: var(--muted);
          font-size: 12px;
        }

        .vm-story-stars {
          display: flex;
          gap: 4px;
          margin-top: 12px;
          color: var(--red);
          font-size: 12px;
        }

        .vm-cta {
          padding: clamp(55px, 7vw, 95px) 20px;
          background:
            radial-gradient(circle at 15% 20%, rgba(255,255,255,.13), transparent 30%),
            linear-gradient(135deg, #e11d48, #be123c 55%, #9f1239);
          color: #fff;
          text-align: center;
        }

        .vm-cta-heart {
          margin-bottom: 17px;
          color: #fecdd3;
          font-size: 35px;
        }

        .vm-cta-title {
          max-width: 850px;
          margin: 0 auto 17px;
          color: #fff;
          font-size: clamp(30px, 4.2vw, 49px);
          font-weight: 900;
          line-height: 1.22;
        }

        .vm-cta-description {
          max-width: 720px;
          margin: 0 auto 31px;
          color: #ffe4e9;
          font-size: 15px;
          line-height: 1.9;
        }

        .vm-cta .vm-button {
          min-height: 52px;
          padding: 15px 27px;
          border-color: #fff;
          background: #fff;
          color: var(--deep-red);
        }

        .vm-cta .vm-button:hover {
          background: #fff1f2;
          color: var(--deep-red);
        }

        @media (max-width: 1100px) {
          .vm-container {
            width: calc(100% - 44px);
          }

          .vm-hero-grid {
            gap: 28px;
          }

          .vm-profile-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .vm-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .vm-hero-title {
            font-size: clamp(36px, 4.5vw, 51px);
          }
        }

        @media (max-width: 760px) {
          .vm-container {
            width: calc(100% - 32px);
          }

          .vm-section {
            padding: 55px 0;
          }

          .vm-heading-center {
            margin-bottom: 30px;
          }

          .vm-section-title {
            font-size: clamp(27px, 6vw, 34px);
          }

          .vm-section-desc {
            font-size: 13px;
          }

          .vm-hero {
            padding: 35px 0 52px;
          }

          .vm-hero-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 35px;
          }

          .vm-hero-title {
            font-size: clamp(36px, 8.7vw, 48px);
            letter-spacing: -1px;
          }

          .vm-hero-description {
            font-size: 14px;
            line-height: 1.85;
          }

          .vm-hero-badge {
            font-size: 11px;
            padding: 9px 12px;
          }

          .vm-search-card {
            padding: 20px;
            border-radius: 21px;
          }

          .vm-search-title {
            font-size: 16px;
          }

          .vm-hero-visual {
            width: 100%;
            padding: 8px;
          }

          .vm-hero-image-wrap {
            border-radius: 24px;
          }

          .vm-hero-image {
            height: clamp(330px, 90vw, 480px);
          }

          .vm-image-overlay {
            padding: 45px 17px 19px;
          }

          .vm-image-overlay h3 {
            font-size: 20px;
          }

          .vm-profile-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .vm-profile-avatar {
            height: 135px;
            font-size: 55px;
          }

          .vm-profile-badge {
            top: 8px;
            right: 7px;
            font-size: 8px;
            padding: 5px 7px;
          }

          .vm-profile-body {
            padding: 13px;
          }

          .vm-profile-title-row {
            flex-direction: column;
            gap: 5px;
            margin-bottom: 13px;
          }

          .vm-profile-name {
            font-size: 16px;
          }

          .vm-profile-community {
            text-align: left;
          }

          .vm-profile-detail {
            gap: 7px;
            font-size: 11px;
          }

          .vm-profile-link {
            font-size: 11px;
            padding: 10px 6px;
          }

          .vm-spotlight-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 30px;
            padding: 19px;
            border-radius: 23px;
          }

          .vm-spotlight-image {
            height: clamp(270px, 75vw, 390px);
          }

          .vm-spotlight-title {
            font-size: clamp(27px, 7vw, 36px);
          }

          .vm-steps-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 17px;
          }

          .vm-step-card {
            padding: 27px 23px;
          }

          .vm-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .vm-feature-card {
            padding: 21px 16px;
          }

          .vm-feature-icon {
            width: 45px;
            height: 45px;
            font-size: 20px;
          }

          .vm-card-title {
            font-size: 16px;
          }

          .vm-card-description {
            font-size: 12px;
          }

          .vm-story-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 17px;
          }

          .vm-story-card {
            padding: 23px;
          }

          .vm-story-quote {
            min-height: 0;
          }

          .vm-center-action .vm-button {
            width: 100%;
          }

          .vm-cta {
            padding: 58px 18px;
          }

          .vm-cta-title {
            font-size: clamp(29px, 7vw, 38px);
          }

          .vm-cta-description {
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .vm-container {
            width: calc(100% - 28px);
          }

          .vm-section {
            padding: 45px 0;
          }

          .vm-hero {
            padding: 28px 0 42px;
          }

          .vm-hero-title {
            font-size: clamp(30px, 8.5vw, 44px);
            letter-spacing: -0.8px;
          }

          .vm-hero-description {
            font-size: 13.5px;
          }

          .vm-search-card {
            padding: 16px;
            border-radius: 18px;
          }

          .vm-search-title {
            font-size: 15px;
          }

          .vm-profile-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .vm-profile-avatar {
            height: 200px;
            font-size: 70px;
          }

          .vm-profile-body {
            padding: 16px;
          }

          .vm-profile-name {
            font-size: 18px;
          }

          .vm-profile-title-row {
            flex-direction: row;
          }

          .vm-feature-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .vm-chip-list {
            gap: 8px;
          }

          .vm-chip {
            padding: 9px 14px;
            font-size: 12px;
          }

          .vm-steps-grid {
            gap: 14px;
          }

          .vm-step-card {
            padding: 24px 18px;
          }

          .vm-step-number {
            width: 50px;
            height: 50px;
            font-size: 16px;
          }

          .vm-story-card {
            padding: 20px;
          }

          .vm-spotlight-grid {
            padding: 16px;
          }

          .vm-spotlight-title {
            font-size: clamp(24px, 7vw, 32px);
          }

          .vm-cta {
            padding: 48px 16px;
          }

          .vm-cta-title {
            font-size: clamp(26px, 7.5vw, 35px);
          }

          .vm-cta-description {
            font-size: 13px;
          }

          .vm-section-title {
            font-size: clamp(24px, 6.5vw, 30px);
          }

          .vm-heading-center {
            margin-bottom: 24px;
          }
        }

        @media (max-width: 380px) {
          .vm-container {
            width: calc(100% - 24px);
          }

          .vm-filter-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .vm-toggle {
            font-size: 11px;
          }

          .vm-profile-grid,
          .vm-feature-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .vm-profile-avatar {
            height: 175px;
          }

          .vm-profile-body {
            padding: 18px;
          }

          .vm-profile-title-row {
            flex-direction: row;
          }

          .vm-profile-name {
            font-size: 18px;
          }

          .vm-profile-community {
            text-align: right;
          }

          .vm-trust-row {
            justify-content: flex-start;
          }

          .vm-button {
            width: 100%;
            padding: 12px 14px;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-home *,
          .vm-home *::before,
          .vm-home *::after {
            scroll-behavior: auto !important;
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <main className="vm-home">
        {/* HERO SECTION */}
        <section className="vm-hero" id="home">
          <div className="vm-container vm-hero-grid">
            <div>
              <div className="vm-hero-badge">
                <FaHeart />
                <span>पवित्र बंधन · Vaivaahik Manch</span>
              </div>

              <h1 className="vm-hero-title">
                Find Your Life Partner With{' '}
                <span>Love &amp; Trust</span>
              </h1>

              <p className="vm-hero-description">
                Welcome to <strong>वैवाहिक मंच</strong> — discover
                meaningful connections, explore compatible partners,
                and bring families together for a beautiful new
                beginning.
              </p>

              <div className="vm-search-card">
                <div className="vm-search-title">
                  <FaMagnifyingGlass />
                  Find Your Perfect Match
                </div>

                <form onSubmit={handleQuickSearch}>
                  <label className="vm-field-label">
                    I am looking for
                  </label>

                  <div className="vm-toggle-row">
                    <button
                      type="button"
                      className={`vm-toggle ${lookingFor === 'bride' ? 'active' : ''
                        }`}
                      aria-pressed={lookingFor === 'bride'}
                      onClick={() => setLookingFor('bride')}
                    >
                      👰 A Bride
                    </button>

                    <button
                      type="button"
                      className={`vm-toggle ${lookingFor === 'groom' ? 'active' : ''
                        }`}
                      aria-pressed={lookingFor === 'groom'}
                      onClick={() => setLookingFor('groom')}
                    >
                      🤵 A Groom
                    </button>
                  </div>

                  <div className="vm-filter-grid">
                    <div>
                      <label
                        className="vm-field-label"
                        htmlFor="vm-min-age"
                      >
                        Age From
                      </label>

                      <select
                        id="vm-min-age"
                        className="vm-select"
                        value={minAge}
                        onChange={(event) =>
                          handleMinAgeChange(event.target.value)
                        }
                      >
                        {ageOptions.map((age) => (
                          <option key={age} value={age}>
                            {age} Years
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="vm-field-label"
                        htmlFor="vm-max-age"
                      >
                        Age To
                      </label>

                      <select
                        id="vm-max-age"
                        className="vm-select"
                        value={maxAge}
                        onChange={(event) =>
                          handleMaxAgeChange(event.target.value)
                        }
                      >
                        {ageOptions.map((age) => (
                          <option key={age} value={age}>
                            {age} Years
                          </option>
                        ))}
                      </select>
                    </div>

                    <SearchableSelect
                      id="vm-state"
                      label="State (राज्य)"
                      placeholder="Select State (राज्य चुनें)"
                      value={state}
                      onChange={handleStateChange}
                      options={availableStates}
                      emptyMessage="No matching states found"
                    />

                    <SearchableSelect
                      id="vm-community"
                      label="Community / Caste (जाति)"
                      placeholder={state ? `Select Caste for ${state} (जाति चुनें)` : "Select State first"}
                      value={community}
                      onChange={(val) => setCommunity(val)}
                      options={availableCastes}
                      emptyMessage={state ? `No castes mapped for ${state}` : "Please select state first"}
                    />

                    <SearchableSelect
                      id="vm-profession"
                      label="Profession / Career"
                      placeholder="Choose Profession or All"
                      value={profession}
                      onChange={(val) => setProfession(val)}
                      options={availableProfessions}
                      specialFirstOption={{
                        value: 'All Professions',
                        label: 'All Professions / Careers',
                      }}
                      emptyMessage="No matching professions found"
                    />
                  </div>

                  <button
                    type="submit"
                    className="vm-button vm-button-primary vm-search-submit"
                  >
                    ✨ Search &amp; Discover Matches <FaArrowRight />
                  </button>
                </form>

                <div className="vm-trust-row">
                  <span className="vm-trust-item">
                    <FaCheck /> Profile checks
                  </span>
                  <span className="vm-trust-item">
                    <FaCheck /> Privacy awareness
                  </span>
                  <span className="vm-trust-item">
                    <FaCheck /> Family connections
                  </span>
                </div>
              </div>
            </div>

            <div className="vm-hero-visual">
              {/* Floating "Find a Meaningful Connection" badge removed */}

              <div className="vm-hero-image-wrap">
                <img
                  src={coupleHeroImg}
                  alt="Indian wedding couple celebrating their marriage"
                  className="vm-hero-image"
                />

                <div className="vm-image-overlay">
                  <small>YOUR BEAUTIFUL BEGINNING</small>
                  <h3>सच्चे रिश्ते, जीवनभर का साथ</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH RESULTS: Shown dynamically ONLY after user submits search */}
        {hasSearched && (
          <section className="vm-section" id="profiles" style={{ scrollMarginTop: "90px" }}>
            <div className="vm-container">
              <div className="vm-heading-center">
                <span className="vm-eyebrow">
                  <FaUserCheck /> Verified Community Matches
                </span>

                <h2 className="vm-section-title">
                  Matched Profiles Found
                </h2>

                <p className="vm-section-desc">
                  Showing <strong>{filteredProfiles.length}</strong> compatible {lookingFor === 'bride' ? 'Bride (वधू)' : 'Groom (वर)'} profiles matching your search preferences.
                </p>

                {/* Dynamic search criterion filter chips */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                  <span style={{ background: '#ffe4e6', color: '#be123c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                    {lookingFor === 'bride' ? '👰 Brides (वधू)' : '🤵 Grooms (वर)'}
                  </span>
                  <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    🎂 {minAge} - {maxAge} Yrs
                  </span>
                  {state && (
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                      📍 State: {state}
                    </span>
                  )}
                  {community && (
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                      💍 Caste: {community}
                    </span>
                  )}
                  {profession && profession.toLowerCase() !== 'all professions' && (
                    <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                      💼 {profession}
                    </span>
                  )}
                </div>
              </div>

              {filteredProfiles.length > 0 ? (
                <>
                  <div className="vm-profile-grid">
                    {filteredProfiles.map((profile) => (
                      <article
                        className="vm-profile-card"
                        key={profile.id}
                      >
                        <div className="vm-profile-avatar">
                          {profile.profilePic ? (
                            <img
                              src={profile.profilePic}
                              alt={profile.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center top",
                                filter: "blur(7px)",
                                transform: "scale(1.08)",
                                transition: "filter 0.3s ease, transform 0.3s ease",
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ filter: "blur(5px)", userSelect: "none" }}>
                              {profile.avatar}
                            </span>
                          )}

                          <div
                            onClick={() => handleConnect(profile)}
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              background: "rgba(0, 0, 0, 0.28)",
                              backdropFilter: "blur(1.5px)",
                              zIndex: 1,
                              cursor: "pointer",
                              padding: "8px",
                              textAlign: "center",
                            }}
                            title={isLoggedIn ? "Click to view full unblurred profile in Dashboard" : "Click to Register or Login to view profile"}
                          >
                            <span
                              style={{
                                background: "rgba(190, 18, 60, 0.94)",
                                color: "#ffffff",
                                padding: "5px 12px",
                                borderRadius: "16px",
                                fontSize: "11px",
                                fontWeight: "800",
                                boxShadow: "0 3px 12px rgba(0,0,0,0.35)",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FaLock style={{ fontSize: "10px" }} /> Profile Protected
                            </span>
                            <span
                              style={{
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: "700",
                                textShadow: "0 1px 3px rgba(0,0,0,0.85)",
                              }}
                            >
                              {isLoggedIn ? "View in Dashboard" : "Login to view"}
                            </span>
                          </div>

                          <span className={`vm-profile-badge ${profile.isReal ? 'real' : ''}`}>
                            {profile.isReal ? "Verified Member" : "Featured Match"}
                          </span>
                        </div>

                        <div className="vm-profile-body">
                          <div className="vm-profile-title-row">
                            <h3 className="vm-profile-name">
                              {profile.name}
                            </h3>

                            <span className="vm-profile-community">
                              {profile.caste}
                            </span>
                          </div>

                          <div className="vm-profile-detail">
                            <FaGraduationCap />
                            <span>
                              {profile.age} Years · {profile.height}
                            </span>
                          </div>

                          <div className="vm-profile-detail">
                            <FaBriefcase />
                            <span>
                              {profile.education}, {profile.profession}
                            </span>
                          </div>

                          <div className="vm-profile-detail">
                            <FaLocationDot />
                            <span>
                              {profile.city}, {profile.state}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="vm-profile-link"
                            onClick={() => handleConnect(profile)}
                          >
                            {isLoggedIn ? 'Connect Now' : 'Register to Connect'} <FaArrowRight />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="vm-center-action">
                    <button
                      type="button"
                      className="vm-button vm-button-outline"
                      onClick={resetSearch}
                    >
                      <FaMagnifyingGlass /> Modify Search
                    </button>
                  </div>
                </>
              ) : (
                <div className="vm-heading-center">
                  <h3 className="vm-section-title">
                    No Matching Profiles Found
                  </h3>

                  <p className="vm-section-desc">
                    Try changing your age range, state, or community
                    preferences.
                  </p>

                  <div className="vm-center-action">
                    <button
                      type="button"
                      className="vm-button vm-button-primary"
                      onClick={resetSearch}
                    >
                      Reset Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* COUPLE SPOTLIGHT */}
        <section
          className="vm-section vm-pink-bg"
          id="featured-couple"
        >
          <div className="vm-container">
            <div className="vm-spotlight-grid">
              <div className="vm-spotlight-image-wrap">
                <img
                  src={coupleCardImg}
                  alt="Indian wedding couple in traditional wedding attire"
                  className="vm-spotlight-image"
                />

                <div className="vm-spotlight-badge">
                  <FaHeart />
                  <span>Celebrating Togetherness</span>
                </div>
              </div>

              <div>
                <span className="vm-eyebrow">
                  <FaRegHeart /> The Beauty of Connection
                </span>

                <h2 className="vm-spotlight-title">
                  Every Love Story Begins With a Beautiful Connection
                </h2>

                <p className="vm-spotlight-description">
                  A lasting relationship grows through trust, mutual
                  respect, shared values, and understanding. Take the
                  first step towards discovering someone who shares
                  your hopes for the future.
                </p>

                <p className="vm-spotlight-caption">
                  Your story. Your values. Your future.
                </p>

                <button
                  type="button"
                  className="vm-button vm-button-primary"
                  onClick={goToRegister}
                >
                  {isLoggedIn ? 'Explore Your Matches' : 'Begin Your Journey'} <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          className="vm-section vm-white"
          id="how-it-works"
        >
          <div className="vm-container">
            <div className="vm-heading-center">
              <span className="vm-eyebrow">
                Simple Three-Step Process
              </span>

              <h2 className="vm-section-title">
                Your Journey to a Meaningful Match
              </h2>

              <p className="vm-section-desc">
                Start with your profile, explore potential connections,
                and take the next step when you are ready.
              </p>
            </div>

            <div className="vm-steps-grid">
              {steps.map((step) => (
                <article className="vm-step-card" key={step.number}>
                  <div className="vm-step-number">{step.number}</div>
                  <div className="vm-step-emoji">{step.icon}</div>
                  <h3 className="vm-card-title">{step.title}</h3>
                  <p className="vm-card-description">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="vm-section vm-pink-bg" id="why-us">
          <div className="vm-container">
            <div className="vm-heading-center">
              <span className="vm-eyebrow">
                <FaShieldHalved /> Trust &amp; Respect
              </span>

              <h2 className="vm-section-title">
                Why Choose Vaivaahik Manch?
              </h2>

              <p className="vm-section-desc">
                A thoughtful matrimonial experience focused on
                compatibility, privacy awareness, and family values.
              </p>
            </div>

            <div className="vm-feature-grid">
              {features.map((feature) => (
                <article
                  className="vm-feature-card"
                  key={feature.title}
                >
                  <div className="vm-feature-icon">{feature.icon}</div>
                  <h3 className="vm-card-title">{feature.title}</h3>
                  <p className="vm-card-description">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SUCCESS STORIES */}
        <section className="vm-section vm-white" id="stories">
          <div className="vm-container">
            <div className="vm-heading-center">
              <span className="vm-eyebrow">
                <FaHeart /> Love &amp; Togetherness
              </span>

              <h2 className="vm-section-title">
                Stories of Love and New Beginnings
              </h2>

              <p className="vm-section-desc">
                Every relationship is unique. Strong connections grow
                through honesty, patience, and mutual respect.
              </p>
            </div>

            <div className="vm-story-grid">
              {stories.map((story) => (
                <article className="vm-story-card" key={story.couple}>
                  <div className="vm-story-quote-icon">
                    <FaQuoteLeft />
                  </div>

                  <p className="vm-story-quote">
                    “{story.quote}”
                  </p>

                  <div className="vm-story-divider" />

                  <div className="vm-story-name">
                    {story.couple}
                  </div>

                  <div className="vm-story-city">{story.city}</div>

                  <div className="vm-story-stars" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar key={star} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="vm-cta" id="join">
          <div className="vm-container">
            <div className="vm-cta-heart">
              <FaHeart />
            </div>

            <h2 className="vm-cta-title">
              Your Next Chapter Could Begin Today
            </h2>

            <p className="vm-cta-description">
              Create your matrimonial profile, share your preferences,
              and take the first step towards finding a compatible
              life partner.
            </p>

            <button
              type="button"
              className="vm-button"
              onClick={goToRegister}
            >
              {isLoggedIn ? 'Go to Your Dashboard' : 'Create Your Profile'} <FaArrowRight />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default HomePage;