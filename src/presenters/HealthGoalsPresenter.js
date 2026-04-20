function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function saveHealthGoals(rating, goals, confidence) {
  await sleep(400);

  return {
    rating,
    goals,
    confidence,
  };
}
