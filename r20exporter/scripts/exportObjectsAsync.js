/* globals getValue, queueImage, launchProgress, getNotesRaw, saveMedia, Jukebox, saveToFile, saveToArray, saveToCampaign, cleanupName, getBlob, timeout */
let imageQueue = [];
let hiresFlag = document.getElementById('export-images-hires').value; //eslint-disable-line no-unused-vars
let filenameLog = [];

let counter = {
	campaignData: {val: 0, max: 0},
	fetch: {val: 0, max: 0},
	zip: {val: 0, max: 0},
}
let exportImages, imagesType, localImages, exportBlobs;

const exportCharacters = (async () => { // eslint-disable-line no-unused-vars

	let schemaVersion = '0.7.5';

	let outputCollection = {name: "", type: "", images: "", schema_version: "", folders: [], array: []};
	let campaign = {name: '', type: '', images: "",	schema_version: schemaVersion, folders: [],	pages: [], handouts: [], characters: [], rollabletables: [], macros: []};
	let campaignProgress = {pages: 0, characters: 0, handouts: 0};
    let campaignName;
	let isGM = window.is_GM //eslint-disable-line no-unused-vars

	const exportCollectionMacros = async (macro, i) => {

		let data = {
			schema_version: schemaVersion,
			name: macro.attributes.name,
			r20id: macro.id,
			r20index: i,
			action: macro.attributes.action
		}
		counter.campaignData.val ++;
		return data;
	}

	const exportRollTable = async (table, i) => {

		let data = {
			schema_version: schemaVersion,
			name: table.attributes.name,
			type: "rollTable",
			r20id: table.attributes.id || "",
			r20index: i,
			showPlayers: table.attributes.showplayers||true,
			tableItems: [],
		}

		await Promise.all(table.tableitems.models.map(async (item) => {
			let imgSrc = item.attributes.avatar||'';
			let itemData = {
				avatar: imgSrc,
				name: item.attributes.name,
				weight: item.attributes.weight,
				image: ''
			}

			if (imgSrc && (exportImages || localImages)) await queueImage(imgSrc, itemData.name).then(v=>itemData.image = v);
			data.tableItems.push(itemData);

		}));
		counter.campaignData.val ++;
		return data;
	}

	const exportPage = async (page) => { // process & export a map page

		let data = {
			schema_version: schemaVersion,
			name: page.attributes.name,
			type: "page",
			images: imagesType,
			r20id: page.attributes.id || "",
			r20index: page.attributes.placement,
			zorder: page.attributes.zorder.split(/,/g) || [],
			attributes: {},
			graphics: {
				map: [],
				gmlayer: [],
				objects: [],
				other: [],
			},
			paths: [],
			text: [],
			idByLayer: {
				map: [],
				gmlayer: [],
				objects: [],
				other: [],
			}
		};

		for (let attr in page.attributes) { // page/map attributes
			data.attributes[attr] = await getValue(page.attributes[attr]);
		}
		
		//console.log(`Processing tokens...`)
		await Promise.all(page.thegraphics.models.map(async (tok) => {

				let gmnotesEscaped = await getNotesRaw(tok.attributes.name).then(v => v);
				let imgName, imgSrc;
				let tokData = {
					id: tok.id,
					image: "",
					attributes: {gmnotes: gmnotesEscaped || ""}
				}
				let isMap = (tok.attributes.layer === 'map') ? true : false;

				for (let attr in tok.attributes) {
					if (attr !== 'gmnotes') {
						if (attr === "name") imgName = tok.attributes[attr];
						if (attr === "imgsrc") imgSrc = tok.attributes[attr];
						tokData.attributes[attr] = await getValue(tok.attributes[attr]);
					}
				}

				if (imgSrc && (exportImages || localImages)) await queueImage(imgSrc, imgName, isMap).then(v=>tokData.image = v);

				let r20layer = (tok.attributes.layer.match(/(map|gmlayer|objects)/i)) ? tok.attributes.layer : 'other';
				data.idByLayer[r20layer].push(tok.id);
				let tokenDone = await data.graphics[r20layer].push(tokData);
				return tokenDone;
		})).then(ok => ok) 			

		for (let path of page.thepaths.models) { // loop through paths
			let pathData = {
				id: path.id,
				attributes: {}
			}
			for (let attr in path.attributes) {
				pathData.attributes[attr] = await getValue(path.attributes[attr]);
			}
			let pathDone = await data.paths.push(pathData); // eslint-disable-line no-unused-vars
		}

		for (let text of page.thetexts.models) { // loop through text
			let textData = {
				id: text.id,
				attributes: {}
			}
			for (let attr in text.attributes) {
				textData.attributes[attr] = await getValue(text.attributes[attr]);
			}
			let textDone = await data.text.push(textData); // eslint-disable-line no-unused-vars
		}
		counter.campaignData.val += 10;
		return data;
	}
	
	const exportHandout = async (handout, i) => { //{same as Character sheet, with one Promise/blob getter for "notes"}

		let blobObj = {gmnotes: '', notes: ''}

		if (exportBlobs) {
			blobObj.gmnotes = await getBlob(handout, 'gmnotes').then(ok=> unescape(ok));
			blobObj.notes = await getBlob(handout, 'notes').then(ok => unescape(ok));
		}
		await timeout(1);

			let data = {
				schema_version: schemaVersion,
				r20id: handout.attributes.id || "",
				r20index: i || -1,
				name: handout.attributes.name || "",
				type: "handout",
				image: "",
				images: imagesType,
				notes:  blobObj.notes || "",
				gmnotes: blobObj.gmnotes || "",
				avatar: handout.attributes.avatar || "",
				tags: handout.attributes.tags || "",
				archived: handout.attributes.archived || false,
				inplayerjournals: handout.attributes.inplayerjournals || "",
			};
			let imgSrc = handout.attributes.avatar;

			if ((exportImages || localImages) && handout.attributes.avatar) await queueImage(imgSrc, data.name).then(v=>data.image = v);

			counter.campaignData.val += 5;
			return data;
	}

	const exportCharacter = async (sheet, i) => {

		let blobObj = {bio: '', gmnotes: '', defaulttoken: ''};	

		if (exportBlobs) {
			blobObj.bio = await getBlob(sheet, 'bio').then(ok=> unescape(ok));
			blobObj.gmnotes = await getBlob(sheet, 'gmnotes').then(ok=> unescape(ok));
			blobObj.defaulttoken = await getBlob(sheet, 'defaulttoken').then(ok=> unescape(ok));
		}

			let data = {
				schema_version: schemaVersion,
				r20id: sheet.attributes.id || "",
				r20index: i,
				name: sheet.attributes.name || "",
				type: "character",
				images: imagesType,
				avatar: sheet.attributes.avatar || "",
				bio: blobObj.bio || "",
				gmnotes: blobObj.gmnotes || "",
				defaulttoken: blobObj.defaulttoken || "",
				tags: sheet.attributes.tags || "",
				controlledby: sheet.attributes.controlledby || "",
				inplayerjournals: sheet.attributes.inplayerjournals || "",
				attribs: [],
				abilities: []
			};

			for (let attrib of sheet.attribs.models) {
				data.attribs.push({
					name: attrib.attributes.name,
					current: attrib.attributes.current,
					max: attrib.attributes.max,
					id: attrib.attributes.id,
				});
			}

			for (let abil of sheet.abilities.models) {
				data.abilities.push({
					name: abil.attributes.name,
					description: abil.attributes.description,
					istokenaction: abil.attributes.istokenaction,
					action: abil.attributes.action,
					order: abil.attributes.order
				});
			}
			let imgSrc = data.avatar; // grab Avatar artwork

			if (imgSrc && (exportImages || localImages)) await queueImage(imgSrc, data.name).then(v=>data.image = v);

			counter.campaignData.val += 5;
			return await data;
	};

	const exportObject = async (objectType, data, i) => {
		if (objectType === 'pages') return await exportPage(data, i).then(okPage => okPage);
		else if (objectType === 'handouts') return await exportHandout(data, i).then(okHand => okHand);
		else if (objectType === 'characters') return await exportCharacter(data, i).then(okChar => okChar);
		else if (objectType === 'rollabletables') return await exportRollTable(data, i).then(okTable => okTable);
		else if (objectType === 'macros') return await exportCollectionMacros(data, i).then(okMacro=>okMacro);
		else return alert(`Unknown data type: ${objectType}`);
	}

	const prepareCampaign = async () => {
		for (let attr in window.Campaign) { 
			await Object.assign(campaign, {[attr]: getValue(window.Campaign[attr])});
		}
		for (let attr in window.Campaign.attributes) {
			await Object.assign(campaign.attributes, {attr: window.Campaign.attributes[attr]});
		}
		let pageDone = await prepareExport(0, 'pages', 'campaign');
		let charDone = await prepareExport(0, 'characters', 'campaign');
		let handDone = await prepareExport(0, 'handouts', 'campaign');
		let tableDone = await prepareExport(0, 'rollabletables', 'campaign');
		let macroDone = await prepareExport(0, 'macros', 'campaign');
		await Promise.all([pageDone, charDone, handDone, tableDone, macroDone]).then(async () => {
			console.log(`Main JSON export completed.`);
			await saveToFile(campaign).then(ok => console.log(`${ok} saved`));
		}).then(async () => {
			if (imageQueue?.length) {
				console.log(`Processing image queue: ${imageQueue.length} images...`);
				await saveMedia('Images', imageQueue, campaignName);
			}
			let audioQueue = Jukebox.playlist.models.map(m=>`${m?.attributes?.track_id}|||${m?.attributes?.title}`);
			if (audioQueue?.length) {
				await saveMedia('Audio', audioQueue, campaignName);
			}
        }).then(() => console.log(`== finished then`))
		console.log(`Finished Export!`);
		launchProgress('end');
	}

	const prepareExport = async (index=0, type, exportType) => { // main loop for sourcing & saving datatype blobs
		
		exportType = (exportType) ? exportType : (document.getElementById('export-as-array').checked) ? 'array' : 'single';
		let targetKey = (type === 'macros') ? window.Campaign.players.models[0].macros._byId : window.Campaign[type]._byId;
		let idKeys = Object.keys(targetKey);
		let loopLimit = parseInt(document.getElementById('limit-number').value);
		loopLimit = (exportType === 'campaign' || loopLimit < 1) ? idKeys.length : loopLimit;

		exportBlobs = document.getElementById('export-blobs').checked;
		exportImages = document.getElementById('export-images').checked;
		localImages = document.getElementById('export-images-type').checked;
		imagesType = (exportImages || localImages) ? 'local' : 'remote';
		let typeString = (exportType === 'campaign') ? 'full Campaign' : (exportType === 'array') ? 'Array' : 'single files';
		let imagesDownload = (exportImages) ? ' and set for download' : '';
		let blobsGet = (exportBlobs) ? '' : '. Blobs are disabled.';

		campaignName = document.title.match(/\|/) ? `${cleanupName(document.title.split('|')[0])}` : `Unknown`;
		let collectionName = `${cleanupName(campaignName)} Collection - ${loopLimit} ${cleanupName(type)}`;
		outputCollection = {
			name: collectionName,
			type: `${type}Collection`,
			schema_version: schemaVersion,
			images: imagesType,
			folders: (window.Campaign.attributes.journalfolder) ? JSON.parse(window.Campaign.attributes.journalfolder) : "",
			array: [],
		}
		Object.assign(campaign, {
			name: campaignName,
			type: 'campaign',
			images: imagesType,
			schema_version: schemaVersion,
			attributes: {},
			folders: (window.Campaign.attributes.journalfolder) ? JSON.parse(window.Campaign.attributes.journalfolder) : "",
		});

		console.log(`Preparing to export ${campaignName} ${type} as ${typeString}. Images set to ${imagesType} paths${imagesDownload}, loop limit set to ${loopLimit}, starting index ${index}${blobsGet}...`);
		for (let i = 0; i < loopLimit; i ++) {
			await exportObject(type, targetKey[idKeys[index]], index).then(async (okData) => {
				if (!okData) {
					console.log(okData);
					return console.log(`Export of ${type} ${index} failed.`);
				}
				console.log(`Finished processing page: "${okData.name}".`);
				if (exportType === 'single') await saveToFile(okData).then(ok => console.log(`${ok} saved`));
				else if (exportType === 'array' || exportType === 'campaign') {
					let arrayLength = await saveToArray(okData, outputCollection).then(ok => {
						console.log(`${ok}/${loopLimit} ${type} processed...`)
						return ok;
					});
					if (arrayLength === loopLimit) {
						if (exportType === 'array') await saveToFile(outputCollection).then((ok) => {console.log(`ok: ${ok} saved`)}); // eslint-disable-line no-unused-vars
						else await saveToCampaign(outputCollection.array, campaign, type).then(ok => {
							console.log(`${ok}/${loopLimit} ${type} done, saved to Campaign Object...`);
							campaignProgress[type] = 1;
							return type;
						});
					}
				}
			});
			index ++;
		} 
	}

	const saveActiveCanvasImages = async () => {
		imageQueue = [];
		filenameLog = [];
		console.log(`=== Starting current canvas image export ===`);
		let currentPage = Campaign.activePage();
		let pageName = document.title.match(/\|/) ? `${cleanupName(document.title.split('|')[0])}` : `Unknown`;
		pageName += ` - page ${currentPage.attributes.placement}`;
		await Promise.all(currentPage.thegraphics.models.map(async (tok) => {
			if (tok.attributes.imgsrc) {
				let isMap = (tok.attributes.layer === 'map') ? true : false;
				await queueImage(tok.attributes.imgsrc, tok.attributes.name, isMap, true)//.then((v) => console.log(v));
			}
		})).then(async () => {
			console.log(`Got ${imageQueue.length} image links, fetching...`);
			await saveMedia('Images', imageQueue, pageName);
			console.log(`=== Finished image export ===`);
		});
	}

	console.log(`Oosh's script initialised...`);

	document.getElementById('export-characters').addEventListener("click", () => {
		let index = parseInt(document.getElementById('page-number').value, 10);
		filenameLog = [];
		prepareExport(index, 'characters');
	});

	document.getElementById('export-handouts').addEventListener("click", () => {
		let index = parseInt(document.getElementById('page-number').value, 10);
		filenameLog = [];
		prepareExport(index, 'handouts');
	});

	document.getElementById('export-pages').addEventListener("click", () => {
		let index = parseInt(document.getElementById('page-number').value, 10);
		filenameLog = [];
		prepareExport(index, 'pages');
	});

	document.getElementById('export-campaign').addEventListener("click", async () => {
		campaign.handouts = [], campaign.characters = [], campaign.pages = [];
		filenameLog = [];
		await launchProgress();
		prepareCampaign();
	});

	document.getElementById('export-header').addEventListener('dblclick', () => {
		let disp = document.getElementById("modal-body").style.display;
		if (disp !== 'none') document.getElementById("modal-body").style.display = 'none';
		else document.getElementById("modal-body").style.display = 'block';
	});

	document.getElementById('export-current-page-images').addEventListener("click", () => {
		filenameLog = []; //eslint-disable-line no-unused-vars
		saveActiveCanvasImages();
	});

	document.getElementById('export-images-hires').addEventListener("change", (ev) => {
		console.log(`Settings change: hires flag is now ${ev.target.value}`);
		hiresFlag = ev.target.value; //eslint-disable-line no-unused-vars
	});

})();