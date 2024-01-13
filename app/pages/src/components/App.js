import { useState, useEffect } from 'react';
import removeBackground from '@imgly/background-removal';

function App() {
  const [ imageUrl, setImageUrl ] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const url = searchParams.get("url");

    removeBackground(url, {
      publicPath: `${window.location.protocol + '//' + window.location.host + window.location.pathname}/static/js/`,
      model: "small",
      output: {
        quality: 0.5
      }
    }).then((imageBlob) => {
      const url = URL.createObjectURL(imageBlob);

      setImageUrl(url);
    });
  }, []);

  return (imageUrl) && (
    <img alt="result" src={imageUrl}/>
  );
}

export default App;
