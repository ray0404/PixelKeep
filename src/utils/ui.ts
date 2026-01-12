import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function htmlToPlainText(html: string) {
  return html
    // Handle block element boundaries
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|h[1-6])>/gi, '\n') // End of block -> newline
    .replace(/<(div|p|li|h[1-6])[^>]*>/gi, '\n') // Start of block -> newline (crucial for first-line boundary)
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
    // normalize newlines (prevent excessive gaps)
    .replace(/\n{3,}/g, '\n\n'); 
}
