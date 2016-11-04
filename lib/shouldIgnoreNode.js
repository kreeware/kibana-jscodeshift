export const shouldIgnoreNode = node =>
  node && node.comments && node.comments.some(comment =>
    String(comment.value).trim() === 'kibana-jscodeshift-ignore'
  )
