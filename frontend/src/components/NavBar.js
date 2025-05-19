import React, {useEffect, useState, useRef, useContext} from "react";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";
import {MyContext} from "../store/store";
import {FaRegBookmark, FaBookmark} from "react-icons/fa6";

export default function NavBar({setFilteredResults}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const {map1, setMap1} = useContext(MyContext);

  const [bookmarkedLocations, setBookmarkedLocations] = useState([]);
  const [openBookMarkList, setOpenBookMarkList] = useState(false);
  const debounceRef = useRef(null);

  // Load bookmarked locations from localStorage on component mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarkedLocations");
    console.log("bookmarkedLocations", savedBookmarks);
    if (savedBookmarks) {
      setBookmarkedLocations(JSON.parse(savedBookmarks));
    }
  }, []);

  // Debounced API call for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (search.trim().length > 0) {
        try {
          const res = await axios.get(
            "http://178.236.185.244:8008/locations/filter/",
            {
              params: {q: search.trim()},
            }
          );
          if (res.data.length > 0) {
            setSuggestions(res.data);
            setShowSuggestions(true);
            setFilteredResults(res.data); // Update displayed data
          }
        } catch (err) {
          console.error("Search error:", err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setFilteredResults([]);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  let getZoom = (lat, lng) => {
    if (!map1) return;
    map1.getView().setCenter([lng, lat]);
    map1.getView().setZoom(15);
  };

  const handleSuggestionClick = item => {
    setSearch(`${item.name} - ${item.location_name}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setFilteredResults([item]); // Optional: show only selected
    getZoom(item.lat, item.lng); // ✅ Zoom to location
  };

  return (
    <nav className="h-16 flex justify-between items-center w-full bg-black text-white px-4 relative">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Link to="/">Logo</Link>
        <Link to="/">Home</Link>
        <Link to="/add">Add New Device</Link>
      </div>

      {/* Search */}
      <div className="relative w-1/3">
        <input
          type="text"
          placeholder="Search by name or location"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="p-2 w-full text-black rounded-md"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 bg-white text-black border w-full max-h-64 overflow-y-auto shadow-md rounded-md">
            {suggestions.map(item => (
              <li
                key={item.id}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleSuggestionClick(item)}
              >
                {item.name} - {item.location_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {openBookMarkList && bookmarkedLocations.length > 0 && (
        <ul className="absolute z-50 bg-white text-black border w-1/3 max-h-64 overflow-y-auto shadow-md rounded-md top-16 right-0">
          {bookmarkedLocations.map(item => (
            <li
              key={item.id}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => handleSuggestionClick(item)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}

      {openBookMarkList && bookmarkedLocations.length == 0 && (
        <h1 className="absolute z-50 bg-white text-black border w-1/3 max-h-64 overflow-y-auto shadow-md rounded-md top-16 right-0">
          No bookmarked saved
        </h1>
      )}
      {/* Right */}
      <div className="flex items-center gap-4 relative">
        <button onClick={() => setOpenBookMarkList(!openBookMarkList)}>
          <FaRegBookmark />
        </button>

        {/* <button onClick={() => navigate("/login")}>Login/Logout</button> */}
      </div>
    </nav>
  );
}
