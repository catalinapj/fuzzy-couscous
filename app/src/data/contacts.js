// Shared contacts data
export const contacts = [
  {
    id: 1,
    name: "Boris Johnson",
    phone: "+44 20 1234 5678",
  },
  {
    id: 2,
    name: "Donald Trump",
    phone: "+1 212 555 1234",
  },
  {
    id: 3,
    name: "Joe Biden",
    phone: "+1 202 555 5678",
  },
  {
    id: 4,
    name: "Barack Obama",
    phone: "+1 202 555 9012",
  },
  {
    id: 5,
    name: "Maia Sandu",
    phone: "+373 22 123 456",
  },
  {
    id: 6,
    name: "Emmanuel Macron",
    phone: "+33 1 42 34 56 78",
  },
];

export function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name) {
  const parts = name.split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";

  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${first}${second}`.toUpperCase(),
  };
}
