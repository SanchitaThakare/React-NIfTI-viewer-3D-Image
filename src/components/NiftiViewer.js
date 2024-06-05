// src/components/NiftiViewer.js
import React, { useState, useEffect } from 'react';
import nifti from 'nifti-reader-js';
import Slider from 'react-slider';

function NiftiViewer({ niftiData }) {
  const [imageData, setImageData] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  useEffect(() => {
    if (niftiData) {
      try {
        if (nifti.isCompressed(niftiData)) {
          niftiData = nifti.decompress(niftiData);
        }
        if (nifti.isNIFTI(niftiData)) {
          const niftiHeader = nifti.readHeader(niftiData);
          const niftiImage = nifti.readImage(niftiHeader, niftiData);
          const dimensions = niftiHeader.dims.slice(1, 4);
          const sliceSize = dimensions[0] * dimensions[1];
          const numSlices = dimensions[2];

          const imageDataArray = [];
          for (let i = 0; i < numSlices; i++) {
            const sliceData = new Uint8Array(sliceSize);
            sliceData.set(new Uint8Array(niftiImage, i * sliceSize, sliceSize));
            imageDataArray.push(sliceData);
          }
          setImageData({ data: imageDataArray, dimensions });
        } else {
          console.error('The file is not a valid NIfTI file.');
        }
      } catch (error) {
        console.error('Error reading NIfTI file:', error);
      }
    }
  }, [niftiData]);

  if (!imageData) {
    return <div>Loading...</div>;
  }

  const handleSliderChange = (value) => {
    setCurrentSlice(value);
  };

  const { data, dimensions } = imageData;
  const sliceData = data[currentSlice];
  const width = dimensions[0];
  const height = dimensions[1];

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const imageDataObject = context.createImageData(width, height);

  for (let i = 0; i < sliceData.length; i++) {
    const value = sliceData[i];
    imageDataObject.data[i * 4] = value;
    imageDataObject.data[i * 4 + 1] = value;
    imageDataObject.data[i * 4 + 2] = value;
    imageDataObject.data[i * 4 + 3] = 255;
  }

  context.putImageData(imageDataObject, 0, 0);
  const imageURL = canvas.toDataURL();

  return (
    <div>
      <div>
        <img src={imageURL} alt={`Slice ${currentSlice}`} width={width} height={height} />
      </div>
      <Slider
        min={0}
        max={dimensions[2] - 1}
        value={currentSlice}
        onChange={handleSliderChange}
        renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
      />
    </div>
  );
}

export default NiftiViewer;
