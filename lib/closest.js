export const closest = (types, path) => {
  if (!Array.isArray(types)) {
    return closest([types], path)
  }

  let parent = path.parent
  const match = node => types.some(t => t.check(node))
  while (parent && !match(parent.node)) parent = parent.parent
  return parent
}
