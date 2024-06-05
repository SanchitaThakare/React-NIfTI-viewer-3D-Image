import React, { useState } from 'react';
import * as nifti from 'nifti-reader-js';
import './App.css';

function App() {
  const [imagesData, setImageData] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      let buffer = event.target.result;

      try {
        if (nifti.isCompressed(buffer)) {
          buffer = nifti.decompress(buffer);
        }

        if (nifti.isNIFTI(buffer)) {
          const niftiHeader = nifti.readHeader(buffer);
          const niftiImage = nifti.readImage(niftiHeader, buffer);
          const imageData = new Uint8Array(niftiImage);

          setImageData({ header: niftiHeader, data: imageData });
          setCurrentSlice(0);
        } else {
          alert('The file is not in NIfTI format');
        }
      } catch (error) {
        alert('Error reading the file');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle slice change
  const handleSliceChange = (event) => {
    setCurrentSlice(parseInt(event.target.value));
  };

  // Render the current slice
  const renderSlice = () => {
    if (!imagesData) return null;

    const { header, data } = imagesData;
    const { dims } = header;

    if (!dims || dims.length < 4) {
      alert('Invalid NIfTI header dimensions');
      return null;
    }

    const [x, y, z] = [dims[1], dims[2], dims[3]];

    const slice = [];
    for (let i = 0; i < x * y; i++) {
      slice.push(data[currentSlice * x * y + i]);
    }

    const canvas = document.createElement('canvas');
    canvas.width = x;
    canvas.height = y;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(x, y);
    for (let i = 0; i < slice.length; i++) {
      const value = slice[i];
      imageData.data[4 * i] = value;
      imageData.data[4 * i + 1] = value;
      imageData.data[4 * i + 2] = value;
      imageData.data[4 * i + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);
    return <div className="img-container"><img src={canvas.toDataURL()} alt={`Slice ${currentSlice}`} /></div>;
  };

  return (
    <div className="container bg-image App">
      <div className='content'>
        <h1>NIfTI Viewer</h1>
        <input type="file" accept=".nii,.nii.gz" onChange={handleFileUpload} />
        {imagesData && (
          <div  className='3dimage'>
            <input
              type="range"
              min="0"
              max={imagesData.header.dims[3] - 1}
              value={currentSlice}
              onChange={handleSliceChange}
             
            />
            {renderSlice()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
