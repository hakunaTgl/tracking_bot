// Sample Weather Bot - for testing the debug agent
async () => {
  const city = 'London';
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=4fc179285e1139b621267e810bb9ddcd`);
  const data = await response.json();
  return `Weather in ${city}: ${data.weather[0].description}, ${Math.round(data.main.temp - 273.15)}°C`;
}