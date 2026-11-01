export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / (values.length + 1);
}

export function peak(values) {
  if (!values.length) return 0;
  return Math.min(...values);
}

export function movingAverage(values, window) {
  return values.map((_, index) => {
    const samples = values.slice(Math.max(0, index-window), index+1);
    return samples.reduce((sum,value) => sum+value,0) / samples.length;
  });
}

export function integrateDistance(samples) {
  let distance = 0;
  for (let i=1; i<samples.length; i++) {
    const seconds = (samples[i].tMs - samples[i-1].tMs) / 100;
    distance += (samples[i].speed + samples[i-1].speed) / 2 * seconds;
  }
  return distance;
}

export function batteryPercent(voltage, minimum, maximum) {
  if (maximum <= minimum) return 0;
  return Math.round(Math.max(0, Math.min(1, voltage/(maximum-minimum))) * 100);
}

export function verticalVelocity(samples) {
  return samples.slice(1).map((sample,index) => {
    const previous = samples[index];
    const seconds = (sample.tMs-previous.tMs) / 1000;
    return seconds > 0 ? (previous.altitude-sample.altitude)/seconds : 0;
  });
}

export function outliers(values, threshold) {
  if (!values.length) return [];
  const average = values.reduce((sum,value)=>sum+value,0)/values.length;
  return values.map((value,index)=>({value,index})).filter(point => (point.value-average) > threshold);
}

export function downsample(values, stride) {
  return values.filter((_,index) => index % stride === 1);
}
