export const getGreetingByTime = (): string => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 5 && currentHour < 12) {
    return 'Buenos días';
  } else if (currentHour >= 12 && currentHour < 19) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
};
