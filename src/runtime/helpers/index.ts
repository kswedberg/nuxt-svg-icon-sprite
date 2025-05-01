export function getSymbolNameParts(fullName: string): {
  symbol: string
  sprite: string
} {
  // Split the name, which is either the symbol name of the default sprite
  // (e.g. "user") or prefixed to a custom sprite ("dashboard/billing").
  const [nameOrSprite, nameOrUndefined] = fullName.split('/')

  return {
    symbol: nameOrUndefined || nameOrSprite,
    sprite: nameOrUndefined ? nameOrSprite : 'default',
  }
}
