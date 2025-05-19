// Home.jsx - Modified version with bookmark functionality

import React, {useEffect, useRef, useState, useContext} from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import "ol/ol.css";
import "ol-ext/dist/ol-ext.min.css";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import axios from "axios";

// Import for vector layers and styling
import {Feature} from "ol";
import {Point} from "ol/geom";
import {Vector as VectorLayer} from "ol/layer";
import {Vector as VectorSource} from "ol/source";
import {Style, Circle, Fill, Stroke, RegularShape, Text} from "ol/style";
import Overlay from "ol/Overlay";
import {HiViewList} from "react-icons/hi";
import ListViewDialog from "../components/Dialogs/ListViewDialog";
import EditLocationDialog from "../components/Dialogs/EditLocationDialog";
import {FaList} from "react-icons/fa";
import {MyContext} from "../store/store";
import {GiDeliveryDrone} from "react-icons/gi";
import {MdOutlineSatelliteAlt} from "react-icons/md";
import {BsDeviceSsd} from "react-icons/bs";
import {FiFilter} from "react-icons/fi";
import {FaBoxOpen} from "react-icons/fa";
import {RiTruckFill} from "react-icons/ri";
import {MdOutlineAllInclusive} from "react-icons/md";
import {FaRegBookmark, FaBookmark} from "react-icons/fa6";
import {toast} from "react-toastify";

// Import for clustering
import {Cluster} from "ol/source";

export default function Home() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupRef = useRef(null);
  const [list, setList] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [openListDaiLog, setOpenListDiaLog] = useState(false);
  const [openLegend, setOpenLegend] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [bookmarkedLocations, setBookmarkedLocations] = useState([]);

  let backupList = useRef(null);

  const {map1, setMap1, selectedData, setSelectedData} = useContext(MyContext);

  // Get all locations from API
  const getAllData = async () => {
    try {
      const response = await axios.get(
        "http://178.236.185.244:8008/locations/"
      );
      console.log("Fetched locations:", response.data);
      if (response) {
        setList(response.data);
        backupList.current = response.data;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  // Load bookmarked locations from localStorage on component mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarkedLocations");
    if (savedBookmarks) {
      setBookmarkedLocations(JSON.parse(savedBookmarks));
    }
  }, []);

  // Handle bookmark toggling
  const toggleBookmark = location => {
    const locationData = {
      id: location.id,
      name: location.name,
      lat: location.lat,
      lng: location.lng,
    };

    // Check if the location is already bookmarked
    const isBookmarked = bookmarkedLocations.some(
      item => item.id === location.id
    );

    let updatedBookmarks;
    if (isBookmarked) {
      // Remove from bookmarks
      updatedBookmarks = bookmarkedLocations.filter(
        item => item.id !== location.id
      );
      toast.success(`${location.name} removed from bookmarks!`);
    } else {
      // Add to bookmarks
      updatedBookmarks = [...bookmarkedLocations, locationData];
      toast.success(`${location.name} added to bookmarks!`);
    }

    // Update state and localStorage
    setBookmarkedLocations(updatedBookmarks);
    localStorage.setItem(
      "bookmarkedLocations",
      JSON.stringify(updatedBookmarks)
    );
  };

  // Check if a location is bookmarked
  const isLocationBookmarked = locationId => {
    return bookmarkedLocations.some(item => item.id === locationId);
  };

  // Handle view more button click
  const handleViewMore = location => {
    setSelectedLocation(location);
    setShowModal(true);
  };

  // Handle filter selection
  const handleFilter = type => {
    setSelectedFilter(type);

    if (type === "all") {
      setList(backupList.current);
    } else {
      const filteredList = backupList.current.filter(location =>
        location.type.toLowerCase().includes(type.toLowerCase())
      );
      setList(filteredList);
    }

    setOpenFilter(false);
  };

  // Get style based on location type
  const getStyleForType = type => {
    // Default style properties
    let image;
    let size = 12;
    let fillColor,
      strokeColor = "#ffffff";

    // Customize style based on type
    switch (type?.toLowerCase()) {
      case "drone":
        // Triangle shape for drones (blue)
        fillColor = "#3498db";
        image = new RegularShape({
          points: 3,
          radius: size,
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
        break;
      case "iot devices":
      case "iot":
        // Diamond shape for IOT devices (green)
        fillColor = "#2ecc71";
        image = new RegularShape({
          points: 4,
          radius: size,
          angle: Math.PI / 4, // 45 degrees rotation for diamond shape
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
        break;
      case "satellite":
        // Star shape for satellites (red)
        fillColor = "#e74c3c";
        image = new RegularShape({
          points: 5,
          radius: size,
          radius2: size / 2,
          angle: 0,
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
        break;
      case "distribution":
        // Circle for distribution (purple)
        fillColor = "#9b59b6";
        image = new Circle({
          radius: size,
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
        break;
      case "storage":
        // Square for storage (orange)
        fillColor = "#f39c12";
        image = new RegularShape({
          points: 4,
          radius: size,
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
        break;
      default:
        // Default circle for unknown types (gray)
        fillColor = "#7f8c8d";
        image = new Circle({
          radius: size,
          fill: new Fill({color: fillColor}),
          stroke: new Stroke({color: strokeColor, width: 2}),
        });
    }

    return new Style({
      image: image,
    });
  };

  // Style function for features (both clustered and single)
  const styleFunction = feature => {
    const features = feature.get("features");
    const size = features ? features.length : 1;

    // If it's a cluster with multiple features
    if (features && size > 1) {
      return new Style({
        image: new Circle({
          radius: 10 + Math.min(size, 10),
          stroke: new Stroke({
            color: "#fff",
          }),
          fill: new Fill({
            color: "#3399CC",
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: "#fff",
          }),
        }),
      });
    }

    // For single features or clusters with just one feature
    const singleFeature = features ? features[0] : feature;
    return getStyleForType(singleFeature.get("properties").type);
  };

  // Add locations to map
  const addLocationsToMap = (map, locations) => {
    if (!map) return;

    // Remove any existing layers
    if (map.get("locationsLayer")) {
      map.removeLayer(map.get("locationsLayer"));
    }

    // Create vector source for locations
    const vectorSource = new VectorSource();

    // Add features for each location
    locations.forEach(location => {
      const feature = new Feature({
        geometry: new Point([location.lng, location.lat]),
        properties: location,
      });
      vectorSource.addFeature(feature);
    });

    let layer;

    if (clusteringEnabled) {
      // Create cluster source
      const clusterSource = new Cluster({
        source: vectorSource,
        distance: 40, // Distance in pixels to cluster
      });

      layer = new VectorLayer({
        source: clusterSource,
        style: styleFunction,
      });
    } else {
      layer = new VectorLayer({
        source: vectorSource,
        style: function (feature) {
          return getStyleForType(feature.get("properties").type);
        },
      });
    }

    map.addLayer(layer);
    map.set("locationsLayer", layer);
  };

  // Setup map
  useEffect(() => {
    // Get location data
    getAllData();

    // Only initialize if mapRef exists and map not already created
    if (mapRef.current && !mapInstanceRef.current) {
      console.log("Initializing map...");

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: "https://mts1.google.com/vt/lyrs=m@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile",
              maxZoom: 19,
              maxNativeZoom: 19,
            }),
          }),
        ],
        view: new View({
          center: [73.79, 20.011],
          zoom: 6,
          projection: "EPSG:4326", // Using WGS84 projection as specified
        }),
      });

      // Store map reference locally
      mapInstanceRef.current = map;
      setMap1(map);

      // Add Nominatim Search control
      const search = new SearchNominatim({
        position: "top-left",
        polygon: false,
        centerToResult: true,
        collapsed: true,
        placeholder: "Search for a place...",
        delay: 500,
      });

      // Add the search control to the map
      map.addControl(search);

      // Handle search selection event
      search.on("select", function (e) {
        // Center map to the selected location
        map.getView().setCenter([e.coordinate[0], e.coordinate[1]]);
        map.getView().setZoom(10);
      });

      // Create popup overlay
      const popup = new Overlay({
        element: popupRef.current,
        positioning: "bottom-center",
        stopEvent: false,
        offset: [0, -10],
      });
      map.addOverlay(popup);

      // Add click handler for locations
      map.on("click", function (evt) {
        const feature = map.forEachFeatureAtPixel(
          evt.pixel,
          function (feature) {
            return feature;
          }
        );

        if (feature) {
          // If it's a cluster with multiple features
          if (feature.get("features") && feature.get("features").length > 1) {
            // Show list of locations in cluster
            const clusterFeatures = feature.get("features");

            // Create a custom popup for cluster
            popup.setPosition(evt.coordinate);
            setPopupInfo({
              name: `Cluster (${clusterFeatures.length} items)`,
              type: "Cluster",
              lat: evt.coordinate[1],
              lng: evt.coordinate[0],
              isCluster: true,
              features: clusterFeatures.map(f => f.get("properties")),
            });

            popupRef.current.style.display = "block";
          } else {
            // Regular feature (single location)
            let locationProps;

            // If it's a cluster with one feature
            if (
              feature.get("features") &&
              feature.get("features").length === 1
            ) {
              locationProps = feature.get("features")[0].get("properties");
            } else {
              locationProps = feature.get("properties");
            }

            console.log("Clicked on location:", locationProps);

            // Set popup position and content
            popup.setPosition(evt.coordinate);
            setPopupInfo(locationProps);

            // Hide any existing popup and show the new one
            popupRef.current.style.display = "block";
          }
        } else {
          // Hide popup when clicking elsewhere
          popupRef.current.style.display = "none";
        }
      });

      // Add pointer cursor when hovering over features
      map.on("pointermove", function (e) {
        if (e.dragging) {
          popupRef.current.style.display = "none";
          return;
        }

        const pixel = map.getEventPixel(e.originalEvent);
        const hit = map.hasFeatureAtPixel(pixel);
        map.getTargetElement().style.cursor = hit ? "pointer" : "";
      });
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when location list or clustering preference changes
  useEffect(() => {
    if (mapInstanceRef.current && list.length > 0) {
      console.log("Updating map with clustering:", clusteringEnabled);
      addLocationsToMap(mapInstanceRef.current, list);
    }
  }, [list, clusteringEnabled]);

  let getZoom = (lat, lng) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.getView().setCenter([lng, lat]);
    mapInstanceRef.current.getView().setZoom(15);
  };

  return (
    <div className="w-full h-full overflow-y-scroll relative">
      <div ref={mapRef} className="w-full h-full absolute"></div>
      {/* Popup */}
      <div
        ref={popupRef}
        className="absolute bg-white rounded-md shadow-lg p-3 min-w-[200px] max-w-[300px] z-10"
        style={{display: "none", transform: "translate(-50%, -100%)"}}
      >
        {popupInfo && !popupInfo.isCluster && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{popupInfo.name}</h3>
              <button
                onClick={() => toggleBookmark(popupInfo)}
                className="text-blue-500 hover:text-blue-700"
              >
                {isLocationBookmarked(popupInfo.id) ? (
                  <FaBookmark className="text-xl" />
                ) : (
                  <FaRegBookmark className="text-xl" />
                )}
              </button>
            </div>
            <p className="text-sm my-1">
              Type: <span className="font-medium">{popupInfo.type}</span>
            </p>
            <p className="text-sm my-1">
              Location:{" "}
              <span className="font-medium">
                {popupInfo.lat.toFixed(4)}, {popupInfo.lng.toFixed(4)}
              </span>
            </p>
            <button
              onClick={() => handleViewMore(popupInfo)}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              View More
            </button>
          </div>
        )}

        {/* Cluster popup content */}
        {popupInfo && popupInfo.isCluster && (
          <div>
            <h3 className="font-bold text-lg">{popupInfo.name}</h3>
            <p className="text-sm mb-2">Click on a location to view details:</p>
            <div className="max-h-40 overflow-y-auto">
              {popupInfo.features.map((location, index) => (
                <div
                  key={index}
                  className="border-t pt-1 pb-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleViewMore(location)}
                >
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-gray-600">{location.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Details Modal */}
      {showModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedLocation.name}</h2>
              <div className="flex items-center">
                <button
                  onClick={() => toggleBookmark(selectedLocation)}
                  className="text-blue-500 hover:text-blue-700 mr-2"
                >
                  {isLocationBookmarked(selectedLocation.id) ? (
                    <FaBookmark className="text-xl" />
                  ) : (
                    <FaRegBookmark className="text-xl" />
                  )}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold">Location Name:</span>{" "}
                {selectedLocation.location_name || selectedLocation.name}
              </div>
              <div>
                <span className="font-semibold">Type:</span>{" "}
                {selectedLocation.type}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {selectedLocation.status}
              </div>
              <div>
                <span className="font-semibold">Usage:</span>{" "}
                {selectedLocation.usage}
              </div>
              <div>
                <span className="font-semibold">Bookmarked:</span>{" "}
                <strong>
                  {isLocationBookmarked(selectedLocation.id) ? "Yes" : "No"}
                </strong>
              </div>{" "}
              <div>
                <span className="font-semibold">Coordinates:</span>{" "}
                {selectedLocation.lat.toFixed(6)},{" "}
                {selectedLocation.lng.toFixed(6)}
              </div>
              {selectedLocation.last_serviced_date && (
                <div>
                  <span className="font-semibold">Last Serviced:</span>{" "}
                  {new Date(
                    selectedLocation.last_serviced_date
                  ).toLocaleDateString()}
                </div>
              )}
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {new Date(selectedLocation.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Legend */}
      <button
        className="absolute bottom-2 right-2 bg-white rounded-sm p-1.5 "
        onClick={() => setOpenLegend(!openLegend)}
      >
        <FaList className="text-2xl" />
      </button>

      {openLegend && (
        <div className="absolute bottom-2 right-9 bg-white p-3 rounded-md shadow-md z-10">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-[#9b59b6] mr-2 border-2 border-white"></div>
              <span>Distribution</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#f39c12] mr-2 border-2 border-white"></div>
              <span>Storage</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 relative">
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                    backgroundColor: "#3498db",
                    border: "2px solid white",
                  }}
                ></div>
              </div>
              <span>Drone</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#2ecc71] mr-2 border-2 border-white"></div>
              <span>IoT Device</span>
            </div>
            <div className="flex items-center">
              <div
                className="w-4 h-4 mr-2"
                style={{
                  clipPath:
                    "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                  backgroundColor: "#e74c3c",
                  width: "16px",
                  height: "16px",
                  border: "2px solid white",
                }}
              ></div>
              <span>Satellite</span>
            </div>
            {clusteringEnabled && (
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#3399CC] mr-2 opacity-70 border-2 border-white"></div>
                <span>Cluster</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* List View */}
      <button
        className="absolute left-2 top-24 bg-white rounded-sm p-0.5 "
        onClick={() => {
          setOpenListDiaLog(!openListDaiLog);
        }}
      >
        <HiViewList className="text-xl" />
      </button>
      {openListDaiLog && (
        <ListViewDialog
          data={list}
          open={openListDaiLog}
          setOpen={setOpenListDiaLog}
          getZoom={getZoom}
          openEdit={openEdit}
          setOpenEdit={setOpenEdit}
          setSelectedData={setSelectedData}
          bookmarkedLocations={bookmarkedLocations}
          toggleBookmark={toggleBookmark}
          isLocationBookmarked={isLocationBookmarked}
        />
      )}

      {openEdit && (
        <EditLocationDialog
          open={openEdit}
          setOpen={setOpenEdit}
          initialData={selectedData}
          onUpdate={getAllData}
        />
      )}

      {/* Filter */}
      <button
        className="absolute top-32 left-2 bg-white p-1 rounded-sm"
        onClick={() => {
          setOpenFilter(!openFilter);
        }}
      >
        <FiFilter className="text-lg" />
      </button>
      {openFilter && (
        <div className="absolute top-32 left-12 bg-white p-2 rounded-md shadow-md z-10">
          <div className="flex flex-col space-y-2">
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "all" ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("all")}
              title="All Locations"
            >
              <MdOutlineAllInclusive className="mr-2" />
              <span>All</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "drone" ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("drone")}
              title="Drones"
            >
              <GiDeliveryDrone className="mr-2" />
              <span>Drones</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "satellite"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("satellite")}
              title="Satellites"
            >
              <MdOutlineSatelliteAlt className="mr-2" />
              <span>Satellites</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "iot" ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("iot")}
              title="IoT Devices"
            >
              <BsDeviceSsd className="mr-2" />
              <span>IoT Devices</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "storage"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("storage")}
              title="Storage"
            >
              <FaBoxOpen className="mr-2" />
              <span>Storage</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "distribution"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleFilter("distribution")}
              title="Distribution"
            >
              <RiTruckFill className="mr-2" />
              <span>Distribution</span>
            </button>
            <button
              className={`flex items-center p-2 rounded ${
                selectedFilter === "bookmarked"
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                // Filter to show only bookmarked locations
                const bookmarkedIds = bookmarkedLocations.map(item => item.id);
                const filteredList = backupList.current.filter(location =>
                  bookmarkedIds.includes(location.id)
                );
                setList(filteredList);
                setSelectedFilter("bookmarked");
                setOpenFilter(false);
              }}
              title="Bookmarked"
            >
              <FaRegBookmark className="mr-2" />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
