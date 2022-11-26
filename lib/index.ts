const sum = (...numbers: number[]) => {
  return numbers.reduce((tot, curr) => tot + curr, 0)
}

export { sum }
