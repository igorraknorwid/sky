/* eslint-disable prettier/prettier */
export function Test({arr}: {arr: string[]}) {
  console.log('TEST');
  return (
    <>
      <h2>TEST</h2>
      <div>
        {arr.map((x) => (
          <div key={x}>{x}</div>
        ))}
      </div>
    </>
  );
}
