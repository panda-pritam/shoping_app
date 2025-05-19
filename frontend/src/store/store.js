// MyContext.js
import React, {createContext, useState} from "react";

export const MyContext = createContext();

export const MyProvider = ({children}) => {
  let [map1, setMap1] = useState(null);
  let [map2, setMap2] = useState(null);
  let [selectedData, setSelectedData] = useState(null);
  let [lat, setLat] = useState(null);
  let [lng, setLng] = useState(null);

  return (
    <MyContext.Provider
      value={{
        map1,
        setMap1,
        map2,
        setMap2,
        selectedData,
        setSelectedData,
        lat,
        setLat,
        lng,
        setLng,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};
