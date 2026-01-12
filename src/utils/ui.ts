import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function htmlToPlainText(html: string) {
  return html
    // Remove <br> that immediately precede a closing block tag, as they are often redundant
    .replace(/<br\s*\/?>\s*<\/(div|p|li|h[1-6])>/gi, '</$1>')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
    .replace(/\n{3,}/g, '\n\n'); // Collapse excessive newlines
}
