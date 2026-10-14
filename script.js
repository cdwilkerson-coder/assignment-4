/*
Name: Cameron Wilkerson
Date: October 14, 2026
Description: Searches TVmaze and displays TV show information.
*/

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const gallery = document.querySelector("#gallery");
const statusMessage = document.querySelector("#status");
let activeController = null;

// Search for shows when the user submits the form.
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const searchTerm = searchInput.value.trim();
    if (searchTerm === "") {
        if (activeController) {
            activeController.abort();
        }

        statusMessage.textContent = "Please enter a TV show.";
        gallery.replaceChildren();
        return;
    }

    searchShows(searchTerm);
});

/**
 * Searches the TVmaze API and displays matching TV shows.
 * @param {string} searchTerm - The TV show name to search for.
 * @returns {Promise<void>} Resolves when the search finishes.
 */
async function searchShows(searchTerm) {
    if (activeController) {
        activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    gallery.replaceChildren();
    statusMessage.textContent = "Loading TV shows...";

    try {
        const url = "https://api.tvmaze.com/search/shows?q="
            + encodeURIComponent(searchTerm);

        const response = await fetch(url, {
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error("Unable to retrieve TV shows.");
        }

        const results = await response.json();
        if (controller.signal.aborted) {
            return;
        }
        const shows = results.slice(0, 10);

        if (shows.length === 0) {
            statusMessage.textContent = "No matching TV shows found.";
            return;
        }

        statusMessage.textContent = "";

        for (const result of shows) {
            const show = result.show;
            const card = document.createElement("article");
            card.className = "show-card";


            if (show.image?.medium) {
                const poster = document.createElement("img");

                poster.src = show.image.medium;
                poster.alt = "Poster for " + show.name;
                poster.loading = "lazy";

                card.appendChild(poster);
            }


            const title = document.createElement("h2");
            title.textContent = show.name;
            card.appendChild(title);

            const summary = document.createElement("p");

            const plainText = new DOMParser().parseFromString(
                show.summary || "", "text/html"
            );

            const fullSummary = plainText.body.textContent.trim();

            summary.textContent = fullSummary.length > 180
                ? fullSummary.slice(0, 180) + "..."
                : fullSummary || "No summary available.";

            card.appendChild(summary);


            const premiered = document.createElement("p");
            premiered.textContent = "Premiered: "
                + (show.premiered || "Not available");
            card.appendChild(premiered);

            const genres = document.createElement("p");
            genres.textContent = "Genres: "
                + (show.genres?.join(", ") || "Not available");
            card.appendChild(genres);

            const rating = document.createElement("p");
            rating.textContent = "Rating: "
                + (show.rating?.average ?? "Not available");
            card.appendChild(rating);


            const updated = document.createElement("p");

            updated.textContent = "Last Updated: "
                + (show.updated != null
                    ? new Date(show.updated * 1000).toLocaleString()
                    : "Not available");

            card.appendChild(updated);


            const castInfo = document.createElement("p");
            castInfo.textContent = "Cast: Loading...";
            card.appendChild(castInfo);

            try {
                const castUrl = "https://api.tvmaze.com/shows/"
                    + show.id + "/cast";

                const castResponse = await fetch(castUrl, {
                    signal: controller.signal
                });
                if (!castResponse.ok) {
                    throw new Error("Unable to retrieve cast.");
                }

                const castData = await castResponse.json();
                if (controller.signal.aborted) {
                    return;
                }

                const castNames = castData.slice(0, 5).map(function (member) {
                    return member.person.name;
                });

                castInfo.textContent = "Main Cast: "
                    + (castNames.join(", ") || "Not available");
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                castInfo.textContent = "Main Cast: Not available";
                console.error(error);
            }


            const link = document.createElement("a");
            link.href = show.url;
            link.textContent = "View on TVmaze";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            card.appendChild(link);

            gallery.appendChild(card);
        }
    } catch (error) {
        if (controller.signal.aborted) {
            return;
        }

        gallery.replaceChildren();

        if (error.message === "Rate limit exceeded") {
            statusMessage.textContent =
                "Too many requests. Please wait and try again.";
        } else {
            statusMessage.textContent =
                "Something went wrong. Please try again.";
        }

        console.error(error);
    }
}

// Display results when the page first loads.
searchShows("Breaking Bad");
