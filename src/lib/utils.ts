import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getZodiacSign(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signs = [
    "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座",
    "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"
  ];
  const dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];

  let index = month - 1;
  if (day < dates[index]) {
    index = (index - 1 + 12) % 12;
  }
  
  return signs[index];
}
