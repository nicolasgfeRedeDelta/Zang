import React, { createContext, useContext, useState } from "react";

const mediaContext = createContext();

const MediaProvider = ({ children }) => {
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChangeMedias = (medias) => {
    if (!medias) {
      return;
    }

    const selectedMedias = Array.from(medias);
    setMedias(selectedMedias);
    return selectedMedias;
  };

  const cleanMedia = () => {
    return setMedias([]);
  }

  return (
    <mediaContext.Provider
      value={{ medias, handleChangeMedias, loading, setLoading, cleanMedia }}
    >
      {children}
    </mediaContext.Provider>
  )
}

const useMedia = () => {
  const media = useContext(mediaContext);

  if (!media) {
    throw new Error("Não existe mídia!");
  }

  return media;
};

export { useMedia, MediaProvider };