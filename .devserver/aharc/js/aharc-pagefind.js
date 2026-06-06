window.addEventListener('DOMContentLoaded', () => {
    new PagefindUI({
        element: "#search",
        showSubResults: false,
        snippetLength: 0,
        excerptLength: 0,
        processResult: (result) => {
            if (result.meta.publication) {
                result.snippet = result.meta.publication;  // replace snippet
            }
            return result;
        }
    });
});
