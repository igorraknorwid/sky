/* eslint-disable prettier/prettier */
import {Link, useNavigate} from '@shopify/hydrogen';
import React from 'react';

export function Prices({
  min,
  max,
  handle,
}: {
  min: number;
  max: number;
  handle: string;
}) {
  const navigate = useNavigate();
  const [init, setInit] = React.useState(false);
  const [minValue, setMinValue] = React.useState(min);
  const [maxValue, setMaxValue] = React.useState(max);
  const setMin = (min: number) => {
    if (!init) {
      setInit(true);
    }
    setMinValue(min);
  };
  const setMax = (max: number) => {
    if (!init) {
      setInit(true);
    }
    setMaxValue(max);
  };
  React.useEffect(() => {
    if (init) {
      navigate(`/collections/${handle}?min=${minValue}&max=${maxValue}`, {
        replace: true,
      });
    }
  }, [minValue, maxValue, navigate, handle, init]);
  return (
    <div>
      {/* <div>{minValue}</div>
      <div>{maxValue}</div> */}
      <div className="flex gap-x-4">
        <button
          onClick={() => {
            setMin(min);
          }}
        >
          {min}
        </button>
        <button
          onClick={() => {
            setMin(Math.floor((max - min) / 4));
          }}
        >
          {Math.floor((max - min) / 4)}
        </button>
        <button
          onClick={() => {
            setMin(Math.floor((max - min) / 2));
          }}
        >
          {Math.floor((max - min) / 2)}
        </button>
        <button
          onClick={() => {
            setMin(Math.floor((max - min) / 1.5));
          }}
        >
          {Math.floor((max - min) / 1.5)}
        </button>
        <button
          onClick={() => {
            setMax(max);
          }}
        >
          {max}
        </button>
      </div>
    </div>
  );
}
