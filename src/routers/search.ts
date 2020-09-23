
import express from "express";
const router = express.Router();

import * as scrapers from "../scrapers";
import { ScraperResponse } from "../types";
import { doSearch } from "../util/doSearch";
import { setMangaProgress } from "../util/getMangaProgress";
import { ProviderId, Scraper, SearchError } from "../scrapers/types";
import { getScraperId, getScraperName, isScraperId } from "./manga-page";
import getReading from "../util/getReading";

router.get("/", (req, res) => {
	let query = ((req.query.q ?? "") as string).trim();
	res.redirect(`/search/mangasee/${query ? `?q=${encodeURIComponent(query)}` : ""}`);
});

router.get("/:provider", async (req, res, next) => {
	let query = ((req.query.q ?? "") as string).trim();

	// Get scraper name
	let param = req.params.provider.toLowerCase();
	const provider: ProviderId | null = isScraperId(param) ? param : null;
	let scraperName = getScraperName(provider);
	if(!scraperName) {
		next();
		return;
	}	

	// Get search results
	  // Get search results
	let searchResults: ScraperResponse[] | SearchError = [];
	searchResults = await doSearch(provider, query);
	  
	  // Verify search results
	if(Array.isArray(searchResults)) {
		await Promise.all(searchResults.map(setMangaProgress));
	}

	// Get reading
	let reading = await getReading(4);

	// Get all scrapers and names
	  
	  // Get all scrapers
	let scrapersArray: Scraper[] = Object.values(scrapers.scrapers);

	  // Get name, id, href, and if whether or not the current scraper
	let scraperMap = scrapersArray.map(scraper => {
		let id = getScraperId(scraper.provider);
		let name = getScraperName(id);
		return {
			id,
			name,
			href: `/search/${id}/${query ? `?q=${encodeURIComponent(query)}` : ""}`,
			isCurrent: id === param
		}
	});

	res.render("search", {
		reading,
		query,
		searchResults,
		isSearch: true,
		scrapers: scraperMap
	});
});

export default router;