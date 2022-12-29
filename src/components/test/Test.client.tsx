/* eslint-disable prettier/prettier */
import {Link} from '@shopify/hydrogen';
import React from 'react';

export function Prices({min, max}: {min: number; max: number}) {
  const [state, setState] = React.useState(0);
  const setMin = (min: number) => {
    setState(min);
  };
  return (
    <div>
      <div>{state}</div>
      <button
        onClick={() => {
          setMin(min);
        }}
      >
        {min}
      </button>
      <div>{max}</div>
    </div>
  );
}
