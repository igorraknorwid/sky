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
  const [minValue, setMinValue] = React.useState(min);
  const [maxValue, setMaxValue] = React.useState(max);
  const setMin = (min: number) => {
    setMinValue(min);
  };
  const setMax = (max: number) => {
    setMaxValue(max);
  };
  React.useEffect(() => {
    navigate(`/collections/${handle}?min=${minValue}&max=${maxValue}`, {
      replace: true,
    });
  }, [minValue, maxValue, navigate, handle]);
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
            setMin(min + 10);
          }}
        >
          {min + 10}
        </button>
        <button
          onClick={() => {
            setMax(max - 10);
          }}
        >
          {max - 10}
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
