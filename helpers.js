/**
 * Convert a timestamp into a more human-readable format.
 * @param timestamp {string} - The timestamp, formatted as an ISO 8601 string.
 * @param options {object} - Options for formatting.
 * @param options.day {boolean} - If `true`, returns just the day with no time
 *   element. (Default: `false`)
 * @param options.space {string} - The space to use between date elements.
 *   (Default: '&nbsp;')
 * @returns {string} - The date formatted per the options chosen.
 */

const formatTimestamp = (timestamp, options) => {
  const d = new Date(timestamp)
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const elems = []
  const space = options && options.space ? options.space : '&nbsp'
  elems.push(d.getDate())
  elems.push(months[d.getMonth()])
  elems.push(d.getFullYear())

  if (options && options.day) {
    return elems.join(space)
  } else {
    const h = d.getHours()
    const hrs = h === 0 ? 12 : h > 12 ? h - 12 : h
    const min = `${d.getMinutes()}`.padStart(2, '0')
    const ampm = h > 11 ? 'PM' : 'AM'
    elems.push(`${hrs}:${min}`)
    elems.push(ampm)
    return elems.join(space)
  }
}

/**
 * Checks if the ID given is the same as the ID of the most recent change on
 * the page provided.
 * @param id {number} - The ID to check for.
 * @param page {Object) - The page object to compare against.
 * @returns {boolean} - `true` if the ID given is the same as the ID of the
 *   page's most recent or change, or `false` if it is not.
 */

const isCurrentVersion = (id, page) => {
  const exists = page && page.history && page.history.changes
  const isArray = exists && Array.isArray(page.history.changes)
  if (isArray && page.history.changes.length > 0) {
    const curr = page.history.changes[page.history.changes.length - 1]
    return curr.id === id
  }
  return false
}

module.exports = {
  formatTimestamp,
  isCurrentVersion
}
