import { Bookmark, UNCATEGORIZED } from '../types';

/**
 * Parses a Netscape Bookmark HTML string (standard export format for Edge, Chrome, etc.)
 */
export const parseBookmarkHtml = (html: string): Bookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  return links.map((link) => {
    const title = link.textContent || link.innerText || 'Untitled';
    const url = link.getAttribute('href') || '';
    const dateAddedStr = link.getAttribute('add_date');
    const dateAdded = dateAddedStr ? parseInt(dateAddedStr, 10) * 1000 : Date.now();
    
    const icon = link.getAttribute('icon');

    return {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url,
      category: UNCATEGORIZED,
      dateAdded,
      icon: icon || undefined
    };
  }).filter(b => b.url.startsWith('http'));
};

/**
 * Utility to get favicon URL
 */
export const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch (e) {
    return '';
  }
};

/**
 * Generates a Netscape Bookmark HTML string from bookmark array
 */
export const generateBookmarkHtml = (bookmarks: Bookmark[]): string => {
  const categories = Array.from(new Set(bookmarks.map(b => b.category)));
  
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  categories.forEach(cat => {
    const catBookmarks = bookmarks.filter(b => b.category === cat);
    html += `    <DT><H3 ADD_DATE="${Math.floor(Date.now()/1000)}" LAST_MODIFIED="${Math.floor(Date.now()/1000)}">${cat}</H3>\n    <DL><p>\n`;
    
    catBookmarks.forEach(b => {
      const date = Math.floor((b.dateAdded || Date.now()) / 1000);
      html += `        <DT><A HREF="${b.url}" ADD_DATE="${date}" ICON="${b.icon || ''}">${b.title}</A>\n`;
    });
    
    html += `    </DL><p>\n`;
  });

  html += `</DL><p>`;
  return html;
};