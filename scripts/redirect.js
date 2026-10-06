// Keep old bookmarks, including case-study IDs and section anchors, working.
location.replace(document.querySelector('link[rel="canonical"]').getAttribute("href") + location.search + location.hash);
