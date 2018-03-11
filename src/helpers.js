// http://alienryderflex.com/hsp.html
export function isLight(hexColor) {
  const color = {
    r: parseInt(hexColor.substring(0, 2), 16),
    g: parseInt(hexColor.substring(2, 4), 16),
    b: parseInt(hexColor.substring(4, 6), 16),
  }
  return (
    Math.sqrt(
      color.r * color.r * 0.099 +
        color.g * color.g * 0.587 +
        color.b * color.b * 0.114
    ) >= 130
  )
}

// Of the form `# - ...`
export const KANBAN_LABEL = /^\d+ - /
export const UNCATEGORIZED_NAME = '999 - Uncategorized'

export function getCardColumn(card) {
  return (
    card.issue.labels.find(label => KANBAN_LABEL.test(label.name)) || {
      name: UNCATEGORIZED_NAME,
      color: 'cccccc',
    }
  )
}

function getColumnRank(label) {
  if (!label) {
    // make sure Uncategorized is the left-most column
    return -1
  }
  const result = /^(\d+)/.exec(label.name)
  return (result && result[1]) || label.name
}

export function sortByColumnName(decrease) {
  if (decrease) {
    return (a, b) => (getColumnRank(a) > getColumnRank(b) ? -1 : 1)
  }
  return (a, b) => (getColumnRank(a) > getColumnRank(b) ? 1 : -1)
}
