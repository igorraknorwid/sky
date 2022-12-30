/* eslint-disable prettier/prettier */
import {Link} from '@shopify/hydrogen';
import React from 'react';

export function Prices({min, max}: {min: number; max: number}) {
  const [minValue, setMinValue] = React.useState(0);
  const [maxValue, setMaxValue] = React.useState(0);
  const setMin = (min: number) => {
    setMinValue(min);
  };
  const setMax = (max: number) => {
    setMaxValue(max);
  };
  return (
    <div>
      <div>{minValue}</div>
      <div>{maxValue}</div>
      <button
        onClick={() => {
          setMin(min);
        }}
      >
        {min}
      </button>
      <button
        onClick={() => {
          setMax(max);
        }}
      >
        {max}
      </button>
    </div>
  );
}
