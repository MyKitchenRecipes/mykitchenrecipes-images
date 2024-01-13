import { useState, useEffect } from 'react';
import removeBackground from '@imgly/background-removal';

function App() {
  const [ imageUrl, setImageUrl ] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const url = searchParams.get("url");

    const image = new Image();

    image.onload = () => {
      const paddingSize = Math.round(Math.max(image.width, image.height) / 10);

      const width = paddingSize + image.width + paddingSize;
      const height = paddingSize + image.height + paddingSize;

      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");

      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);

      context.drawImage(image, 0, 0, width, height, paddingSize, paddingSize, width, height);

      canvas.convertToBlob().then((blob) => {
        removeBackground(blob, {
          publicPath: `${window.location.protocol + '//' + window.location.host + window.location.pathname}/static/js/`,
          model: "medium",
          output: {
            quality: 0
          }
        }).then((imageBlob) => {
          const url = URL.createObjectURL(imageBlob);
    
          setImageUrl(url);
        });
      });
    };

    image.crossOrigin = "anonymous";
    image.src = url;
  }, []);

  return (imageUrl) && (
    <img alt="result" src={imageUrl}/>
  );
}

export default App;
