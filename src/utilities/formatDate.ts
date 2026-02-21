const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date)

  const [monthAndDay, year] = formattedDate.split(", ")
  const [month, day] = monthAndDay.split(" ")

  const dayNumber = parseInt(day, 10)
  const suffix =
    dayNumber % 10 === 1 && dayNumber !== 11
      ? "st"
      : dayNumber % 10 === 2 && dayNumber !== 12
        ? "nd"
        : dayNumber % 10 === 3 && dayNumber !== 13
          ? "rd"
          : "th"

  return `${month} ${day}${suffix}, ${year}`
}

export default formatDate
