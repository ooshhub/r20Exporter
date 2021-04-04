/* globals saveAs, hiresFlag, exportImages, JSZip, counter, imageQueue, filenameLog */
/* eslint-disable no-unused-vars */

const getValue = async (attribute) => {
	return resolveKey(attribute).then(v => {
		//console.log(v);
		return v
	});
}

const resolveKey = async (key) => {
	return await key;
}

const getNotesRaw = async (notesRaw) => {
	let notes;
	try {
		notes = unescape(notesRaw);
		return notes;
	} catch(err) {
		console.log(`${notes}: ${err}`);
		return null;
	}
}

const getBlob = async (sourceObject, blob) => {
	return new Promise(res => sourceObject._getLatestBlob(blob, (v) => res(v)));
}

const timeout = async (ms) => {
	await new Promise(res=>setTimeout(res,ms))
}

const queueImage = async (imgSrc, itemName, isMap=false, imgOnly=false) => {
	let newImgName = await nameImage(imgSrc, itemName||'unnamed token', filenameLog)
	if (hiresFlag === 'on') { // Point image source to highest res file if "force hi-res" option is selected
		imgSrc = (/original\./i.test(imgSrc)) ? imgSrc : imgSrc.replace(/(max\.|med\.|thumb\.)/i, 'original.');
	} else if (hiresFlag === 'map' && isMap) { // "Map-Only" hi-res option
		imgSrc = (/original\./i.test(imgSrc)) ? imgSrc : imgSrc.replace(/(max\.|med\.|thumb\.)/i, 'original.');
	}
	if (newImgName) {
		if ((exportImages || imgOnly) && newImgName.search(/^!DUPE!/) === -1) imageQueue.push(`${imgSrc}|||${newImgName}`);
		else newImgName = newImgName.replace(/^!DUPE!/,'');
		return newImgName || '';
	} else {
		console.log(`Error in nameImage function ???`);
		return '';
	}
}

const nameImage = async (url, name, log) => {
	let y;
	let x = url.match(/\/(\d+)\/([^./]+)\/([^.]+).([^?]+)/);
	if (!x) y = url.match(/\/(\d+)\/([^.]+).([^?]+)/);
	let newName = (x) ? `${x[1]}--${x[2]}--${x[3]}.${x[4]}` : (y) ? `${y[1]}--${y[2]}.${y[3]}` : name;
	if (!log.includes(newName)) {
		log.push(newName);
		return(newName);
	} else {
		//console.log(`Duplicate image source for ${name}`);
		return `!DUPE!${newName}`;
	}
}

const getImage = async (url, name) => { //xhr get request for imgsrc
	var xhr = new XMLHttpRequest();
	xhr.responseType = 'blob'; 
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState == xhr.DONE) {
			saveAs(xhr.response, `${name}`);
		}
	};
	xhr.send();
}

const stringifyObject = (e) => {
	const obj = {};
	for (let k in e) {
		obj[k] = e[k];
	}
	return JSON.stringify(obj, (k, v) => {
		if (v instanceof Node) return 'Node';
		if (v instanceof Window) return 'Window';
		return v;
	}, ' ');
}

const saveToFile = async (inputBlob, name) => {
	let filename = (name) ? name : (inputBlob.name) ? inputBlob.name : "noname";
	let jsonData = await stringifyObject(inputBlob);
	var jsonBlob = new Blob([jsonData], {
		type: 'data:application/javascript;charset=utf-8'
	});
	console.log(`Saving as ${inputBlob.name}.json...`)
	await saveAs(jsonBlob, filename + ".json");
	return filename;
}
	
const saveToArray = async (inputObject, outputArray) => {
	await outputArray.array.push(inputObject);
	return outputArray.array.length;
}

const saveToCampaign = async (inputObject, campaignObject, type) => {
	console.log(`${inputObject.length} entries to copy to ${[campaignObject[type]]}...`)
	campaignObject[type] = await inputObject;
	return campaignObject[type].length;
}

const cleanupName = (txt) => {
	if (typeof(txt) !== 'string' || !txt.match(/\s/)) return txt;
	let words = txt.trim().split(/\s/g);
	let newW = words.map((w) => `${w[0].toUpperCase()}${w.slice(1).toLowerCase()}`);
	return newW.join(' ');
}

const dragElement = (elmnt) => {
	let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	const dragMouseDown = (e) => {
		e = e || window.event;
		e.preventDefault();
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}
	
	const  elementDrag = (e) => {
		e = e || window.event;
		e.preventDefault();
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	}
	
	const closeDragElement = () => {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}

	if (document.getElementById("export-header")) {
		// if present, the header is where you move the DIV from:
		document.getElementById("export-header").onmousedown = dragMouseDown;
	} else {
		// otherwise, move the DIV from anywhere inside the DIV:
		elmnt.onmousedown = dragMouseDown;
	}
}
dragElement(document.getElementById("export-modal"));

const unwrapMultiline = (inputString) => {
    let str = inputString.trim().replace(/,*\s*(\n|\\n)\s*/g, ',');
    console.log(str);
	if (str.match(/^{{.+}}$/)) {
		str = str.replace(/\n/g, '').replace(/^{{,*/, '').replace(/,*}}$/, '');
	} return str;
}

const jsonifyString = (input, array = false) => {
    let output = input.replace(/^[\s["']*/, '')
        .replace(/[\s\]"']*$/, '')
        .replace(/["'\s]*{["'\s]*/g, '"{"')
        .replace(/["'\s]*}["'\s]*/g, '"}"')
        .replace(/["'\s]*:["'\s]*/g, '":"')
        .replace(/["'\s]*,["'\s]*/g, '","');
    output = (output.match(/^["'\s]*{["'\s]*/)) ? output.replace(/^["'\s]*{["'\s]*/, '{"') : `{"${output}`;
    output = (output.match(/["'\s]*}["'\s]*$/)) ? output.replace(/["'\s]*}["'\s]*$/, '"}') : `${output}"}`;
    output = output.replace(/}\s*"+\s*}/g, '}}')
        .replace(/,\s*"+\s*{/g, ',{')
        .replace(/}\s*"+\s*,/g, '},')
        .replace(/:\s*"\s*}/g, ':""}')
        .replace(/:\s*"+\s*{/g, ':{');
    if (array) output = `[${output}]`;
    return output;
}

const escapeRegex = (string) => {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key, value) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

const saveMedia = async (mediaType, inputArray=[], campaignName) => {
	//const needFiles = ['92921654--Zy4KAPLjJeZYHx6JJN5drg--med.jpg','643386--tayGg_UmgwgcQyzV3_UIwQ--thumb.png','643425--VK1fcLloOGhOGvoHwRqOTQ--thumb.png','643431--INdIsTFy5ta7dmhOPwjwjA--thumb.png','643451--JcSIwOb7Aq29e6HXMWdwKA--thumb.png','91195247--YRz578Py7NH4msNdfv4rAg--max.png','91195209---8cZ5Qu0F-RBlx5iCh83Xg--max.png','91195240--woIpCLDEAIIFGpFl-kjn3Q--max.png','91195186--E1az85bMvN3MItyBPWB2cw--max.png','91195247--YRz578Py7NH4msNdfv4rAg--max.png','91195039--kXlWI5N-jSGpVtnnvMkhDQ--max.png','91195048--WZelQ2YfN9i7eyZ1jkbwBQ--max.png','91195064--9wKPT8HSMEfOkc1pMCCzrA--max.png','91195169--EWzyQfuNU0eHQ_uSEhH24Q--max.png','91195127--ea_sM1lU-gaWUYo84MMz2g--max.png','91195106--t9i8HoIOwrw56pm4AUQHuw--max.png','91195093--aa6250S9WmkbAnliqqLWKA--max.png','643955--hNjeGy_wrNhFtoRAI69fkA--med.png','643956--Zq3EXjOoV_-flGdf04Eylg--med.png','643958--Q385Y4aeScHsOxxn8BLUng--med.png','643959--Sq7bHdmHcFe2L6Nd44hoKw--med.png','643960--_yL8NdHs1w4Dx_LwRxa8NQ--med.png','643962--grXioDF34iehn63WzElmWw--med.png','643963--vK8hKKwEJa32quS66k__Ug--med.png','643964--6aInJkBG5N1Rh4CTvwbjtA--med.png','643966--EGLQOfT2MqpFi0csAlJLwA--med.png','643967--vhMzS0UWag0-MnqaOvtHCw--med.png','643979--TNDSVSd8LyyuBvae3OgBCw--med.png','644335--mCp6l4K0ZANU8Fle3-o6MQ--med.png','644336--ckenfZUvMYgr_ifdKmEopw--med.png','644337--is0FC6UeH_zoyg4U1Koclg--med.png','644338--oXC9kJAMjAi_2gLLgvkebA--med.png','644340--il8f9Utn8SXW6GEH66w0ig--med.png','644341--TRA1s96pwxex-iqAggo-oQ--med.png','91195022--_6js2uOZTmsmRRGzxrMEsA--max.png','91195161--aSLcfsOeUPA1LOEVOjTVNg--max.png','91194985--sMhd2vxBY3dTk9KDq-Z92w--max.png','91194982--pMMYxi-5QTqGl91mWLmigQ--max.png','91195128--lZl5AGQ8MOiuk95zUpn5EA--max.png','91195229--o-hY3ZiC6FVrMTCpZGfEWw--max.png','91195240--woIpCLDEAIIFGpFl-kjn3Q--max.png','91195238--S1RhO6yAim9cuLDbK7piDw--max.png','91195236--We0xs_EzABxmfTpLV5GRrQ--max.png','91195131--4bXMhEbiYQc3ilEG9NvWvg--max.png','91195123--FcIh5KV699s7un5RlH3Ohg--max.png','91195118--3S5WQbhrsFMF8uT-Ylevhw--max.png','91194992--Yi1_JffkiIdkRdc1KKxZOQ--max.png','91195003--u7FoCuLYOxWPXUow5tZ-3Q--max.png','91195022--_6js2uOZTmsmRRGzxrMEsA--max.png','91194998---TDaK7HCsacOrZIKlhYsfQ--max.png','91195038--Y0VkrhXjrMfL_DcxZpQuZQ--max.png','91195023--V4b1bSvwv42AZnoJWIgefg--max.png','91195140--Vz9cGM6YvCUICAyNkXvIsA--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91195138--7C2ZAqiqCrxyvYj0NoB0fw--max.png','91195139--0_MDXafIDX9365lcHukInQ--max.png','91195023--V4b1bSvwv42AZnoJWIgefg--max.png','91195129--B96Y5iMcWaIiWWeRmpH8yg--max.png','91195137---d6DeLh5MNmCGo8rFOhr4Q--max.png','91195055--Hg_yx1CuCjxNpFFJtCqpQw--max.png','91195091--hGgZtDDOWWseMU52DfcmMg--max.png','91195092--E4OuxYxapWaue1yaETRaXg--max.png','91195092--E4OuxYxapWaue1yaETRaXg--max.png','91194994--bSFdldE68Tk-RMB53JS0Aw--max.png','91195022--_6js2uOZTmsmRRGzxrMEsA--max.png','91195140--Vz9cGM6YvCUICAyNkXvIsA--max.png','91195033--4tC7FqLLwAs6UbGCWNX5Xw--max.png','91195029--VSQt-vv9JqZU4ue2dI8pVg--max.png','91195046--MnmxyqZaeGL29gnFMWknaw--max.png','91195138--7C2ZAqiqCrxyvYj0NoB0fw--max.png','91195147--Ep-cvWFke15393fu6-5oIA--max.png','91195134--xNgRYJ3u8x_WbGKssVnY3g--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91195088--GQJQOCy8qM0wfHu8-bpSYA--max.png','91195118--3S5WQbhrsFMF8uT-Ylevhw--max.png','91195135--IQv6K-eEdDapXo0RewYPGg--max.png','91195123--FcIh5KV699s7un5RlH3Ohg--max.png','91195055--Hg_yx1CuCjxNpFFJtCqpQw--max.png','91194962--jOJYv2BuQG0LOZUwjadkVA--max.png','91194995--33dGbXtYgrrsddSeGcan4Q--max.png','91194990--E9ZAmoSQQ7fy93bRS92Xvw--max.png','91194992--Yi1_JffkiIdkRdc1KKxZOQ--max.png','91194985--sMhd2vxBY3dTk9KDq-Z92w--max.png','91194982--pMMYxi-5QTqGl91mWLmigQ--max.png','91194973--1cfnxoGy3KHvg2qfAkNKhg--max.png','91194990--E9ZAmoSQQ7fy93bRS92Xvw--max.png','91195058--A2clHNsZoCRsAxg_Vwt0lw--max.png','91195091--hGgZtDDOWWseMU52DfcmMg--max.png','91195201---G39-cpl6-xCSR_SH_iXhw--max.png','91194995--33dGbXtYgrrsddSeGcan4Q--max.png','91195139--0_MDXafIDX9365lcHukInQ--max.png','91195065--23IRLHJZnv-ggiPyhRUibQ--max.png','91195064--9wKPT8HSMEfOkc1pMCCzrA--max.png','91195051--4m0BuM9krBcIfiBAxZquTg--max.png','91194972--axoH1WeMtK3qIcF-6rakkg--max.png','91195055--Hg_yx1CuCjxNpFFJtCqpQw--max.png','91194985--sMhd2vxBY3dTk9KDq-Z92w--max.png','91195164--aQcp6zFP6ckZCjrR_JUXCg--max.png','91195173--WB-esNNKc5_qPhmSUdnNGw--max.png','91195166--5kKlXFdvZ-cTMchKvjeDtQ--max.png','91195163--IFRDYKhCzMpsYw9IjjdaYw--max.png','91195162--AoCYlFeoqWV96ZrQzLYpUw--max.png','91195158--pOOCyvEkjDHVvWDSOkprzw--max.png','91195161--aSLcfsOeUPA1LOEVOjTVNg--max.png','91195160--amkDdZ54S8Ns2WZpkYfU9w--max.png','91195145--oxrH_FlJU54DwQLC0j3wmA--max.png','91195142--gWfAi2y5ym2UI1xg73UUSw--max.png','91195139--0_MDXafIDX9365lcHukInQ--max.png','91195132--CwF-NlSCxbF5rDApie6veQ--max.png','91195097--G7VclcbQuWuD5KWrSQitsQ--max.png','91195093--aa6250S9WmkbAnliqqLWKA--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91195009--LpiXRoWoAY3FQXQJqzzWGA--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91194982--pMMYxi-5QTqGl91mWLmigQ--max.png','91195213--e4pvs-zBG1FQT3bZrUGw3Q--max.png','91195220--s3u0mAzoi9rwSxQsjYtZYg--max.png','91195167--H-my9tAaZ0sxHyZhsl9jjg--max.png','91195170--Pv8JxQnWbC2Upf6AHtIDIw--max.png','91195168--YQ1ZCDkLOk9M7vAColw2tw--max.png','91195154--cs2D7xPoHZdi7gkzbcT5Iw--max.png','91195135--IQv6K-eEdDapXo0RewYPGg--max.png','91194989--nmvOLopuj4SupAf6yy-xjQ--max.png','91195064--9wKPT8HSMEfOkc1pMCCzrA--max.png','91195149--d_uXqd962L3F_2xpSQqBmw--max.png','91195117--1pPMNepcGoP9uAdsIYYfuQ--max.png','91195097--G7VclcbQuWuD5KWrSQitsQ--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91194976--BfB4knDHfliMPtjqZ5q4pg--max.png','91195098--scHI8lQCV3brBWwanvsBHg--max.png','91195108--S64IUbXcEQsvXb5dg0hcnQ--max.png','91194969--bzWFp8AKLw0aRGGY_jDAzQ--max.png','91195145--oxrH_FlJU54DwQLC0j3wmA--max.png','91195055--Hg_yx1CuCjxNpFFJtCqpQw--max.png','91195000--wkVCfDhiaBXHoN-rkIHdEg--max.png','91194976--BfB4knDHfliMPtjqZ5q4pg--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91195215--bMbmyoA_HrnGbqHJO_yiEA--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91195097--G7VclcbQuWuD5KWrSQitsQ--max.png','91195138--7C2ZAqiqCrxyvYj0NoB0fw--max.png','91195142--gWfAi2y5ym2UI1xg73UUSw--max.png','91195033--4tC7FqLLwAs6UbGCWNX5Xw--max.png','91195008--16goArJxr6x1oql49cSbEw--max.png','91195048--WZelQ2YfN9i7eyZ1jkbwBQ--max.png','91195064--9wKPT8HSMEfOkc1pMCCzrA--max.png','91195089--tMz7BxO6PbJZbj2VjGN_NA--max.png','91195090--iI8nQe92yF3Gg30YURt-rg--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91195093--aa6250S9WmkbAnliqqLWKA--max.png','91195097--G7VclcbQuWuD5KWrSQitsQ--max.png','91195023--V4b1bSvwv42AZnoJWIgefg--max.png','91195039--kXlWI5N-jSGpVtnnvMkhDQ--max.png','91195049--1NIvFuq587IiJJF6-n-IZA--max.png','91195182--XKRj2xIfFXF1SFvZIB-Zzg--max.png','91195000--wkVCfDhiaBXHoN-rkIHdEg--max.png','91195093--aa6250S9WmkbAnliqqLWKA--max.png','91195179--ys5qyU5P8zcVesNX3YBWCQ--max.png','91195160--amkDdZ54S8Ns2WZpkYfU9w--max.png','91195240--woIpCLDEAIIFGpFl-kjn3Q--max.png','91195092--E4OuxYxapWaue1yaETRaXg--max.png','91195008--16goArJxr6x1oql49cSbEw--max.png','91195094--UCeljJuTGq8NO9qiFvIT9w--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91195023--V4b1bSvwv42AZnoJWIgefg--max.png','91194959--C_iH0hgj6MpDFfj4M-EGOg--max.png','91195091--hGgZtDDOWWseMU52DfcmMg--max.png','91194961--64eKXEdlDu22fOA-88bqbA--max.png','91195060--E6nJw50pMGbL2kXCJbn6Pw--max.png','91195031--InwoUFP-Syp9AIz_dPG_9Q--max.png','91195173--WB-esNNKc5_qPhmSUdnNGw--max.png','91195005--3e4Ty-V1gVPrL9NAyV8mcg--max.png','91195048--WZelQ2YfN9i7eyZ1jkbwBQ--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91195046--MnmxyqZaeGL29gnFMWknaw--max.png','91195134--xNgRYJ3u8x_WbGKssVnY3g--max.png','91195140--Vz9cGM6YvCUICAyNkXvIsA--max.png','91194969--bzWFp8AKLw0aRGGY_jDAzQ--max.png','91194973--1cfnxoGy3KHvg2qfAkNKhg--max.png','91195135--IQv6K-eEdDapXo0RewYPGg--max.png','91195234--l0BszrFLl3dS8JmRZKvr-g--max.png','91195007--XbsXMgNEZ-B5VoIKqxP-Jg--max.png','91194985--sMhd2vxBY3dTk9KDq-Z92w--max.png','91195106--t9i8HoIOwrw56pm4AUQHuw--max.png','91194989--nmvOLopuj4SupAf6yy-xjQ--max.png','91195138--7C2ZAqiqCrxyvYj0NoB0fw--max.png','91195142--gWfAi2y5ym2UI1xg73UUSw--max.png','91195243--3weSbV0WgYWqcJbf1zc1Eg--max.png','91195127--ea_sM1lU-gaWUYo84MMz2g--max.png','91195140--Vz9cGM6YvCUICAyNkXvIsA--max.png','91195147--Ep-cvWFke15393fu6-5oIA--max.png','91195140--Vz9cGM6YvCUICAyNkXvIsA--max.png','91195136--tB5ZQjcGEsHkC4O87LWS3Q--max.png','91195056--hAfTd590pROsIffo5oua3g--max.png','91195154--cs2D7xPoHZdi7gkzbcT5Iw--max.png','91195159--xPDEDkCS2LS4UicXIuNwqQ--max.png','91195154--cs2D7xPoHZdi7gkzbcT5Iw--max.png','91195103--uotvw9KW3QaIbX-e5a_1Kw--max.png','91195126--PVh3Odj8bK_iZr-LdP1aYg--max.png','91195135--IQv6K-eEdDapXo0RewYPGg--max.png','91195133--f9CgYXR-pxzXxchpq4X-Qg--max.png','91194991--EgiyEMegGlifTb7UstilvQ--max.png','91194989--nmvOLopuj4SupAf6yy-xjQ--max.png','91194960--9989s67-Eg6a7AutTf3doQ--max.png','91194961--64eKXEdlDu22fOA-88bqbA--max.png','91194975--x2UvC8l1q5wihVstXyoP4w--max.png','91195048--WZelQ2YfN9i7eyZ1jkbwBQ--max.png','91194964--PFt_UygTc1Vrm-lGq0a-8A--max.png','91195138--7C2ZAqiqCrxyvYj0NoB0fw--max.png','91194990--E9ZAmoSQQ7fy93bRS92Xvw--max.png','91194985--sMhd2vxBY3dTk9KDq-Z92w--max.png','91194992--Yi1_JffkiIdkRdc1KKxZOQ--max.png','91195119---3l_HlnXP8wpj_2pIM_7Ew--max.png'];
	// comment out needFiles to remove missing file check
	let media = (mediaType === 'Images') ? 'Image' : 'Track';
	let suffix = ['max.', 'med.', 'thumb.'];
	let failedImages = [];
	let campaignId = window.campaign_id;

	if (!Array.isArray(inputArray) || !inputArray.length || (mediaType !== 'Images' && mediaType !== 'Audio')) return;
	let filename = (typeof(campaignName) !== 'undefined') ? `${campaignName} - ${mediaType}.zip` : `Unnamed Campaign - ${mediaType}.zip`;
	let src = [], fname = [];

	if (mediaType === 'Images') {
		launchProgress('fetch');
		inputArray.map(i => {
			let parts = i.match(/(.+)\|\|\|(.+)/);
			if (parts && parts.length > 2) {
				src.push(parts[1]);
				fname.push(parts[2]);
			}
		});
	} else if (mediaType === 'Audio') {
		inputArray.map(track => {
			let parts = track.match(/(.+)\|\|\|(.+)/);
			if (parts && parts.length > 2) {
				src.push(`https://app.roll20.net/audio_library/play/${campaignId}/${parts[1]}`);
				fname.push(`${parts[2]}---${parts[1].replace(/\D/g,'')}.mp3`);
			}
		});
	}

	console.log(`${mediaType} sources length: ${src.length}`);
	console.log(`${mediaType} names length: ${fname.length}`);

	const fetchBlobs = async (urls) => {
		let prom = await Promise.all(urls.map(async (url, i) => {
			await timeout(10);
			let resp = await fetch(url).catch(err=>console.log(err));
			let retry = 0
			//.then(async (resp) => {
				if (mediaType === 'Images' && (!resp || resp?.status !== 200)) {
					//console.warn(`Error getting image ${i} - retrying with alternate image size`);
					let imgTry;
					for (imgTry=0; imgTry<4; imgTry++) {
						let newUrl = url.replace(/(original\.|max\.|med\.|thumb\.)/i, suffix[imgTry]);
						let newResp = await fetch(newUrl).catch(err=>console.log(err));
						if (newResp?.status === 200) {
							console.log(`${media} fetch succeeded with alternate size - ${suffix[imgTry]}`);
							resp = newResp;
							imgTry = 5;
						}
					}
					if (imgTry === 4) {
						console.log(`=== Couldn't get image, logging failure ===`);
						retry = 1;
						failedImages.push(url);
					}
				}
				counter.fetch.val ++;
				if (resp?.status === 200) {
					let blob = await resp.blob();
					blob.name = fname[i];
					if (i%10===0 || i > urls.length-10) console.log(`Processed ${media} ${i}: "${blob.name}"`);
					return blob;
				} else return null;
		}));
		console.log(`=== ${mediaType} Promises All returned.`);
		return prom;
	}

	const pack = (blobs) => {
		const zip = new JSZip();
		let counterZip = 0;
		console.log(`Zipping ${blobs.length} blobs...`);
		Promise.all(blobs.map((blob, i) => {
			//console.log(blob);
			if (!blob) console.warn(`Skipping blob ${i}, undefined.... missing ${media}!`)
			else {
				zip.file(blob.name, blob);
				counterZip ++;
				if (counterZip%10 === 0) console.log(`Zipped ${counterZip}/${src.length} files...`);
			}
		}));
		if (mediaType === 'Images' && failedImages.length) {
			console.info(`Adding failed images text file`);
			zip.file('FailedImagesJSONString.txt', JSON.stringify(failedImages));
			launchProgress('zip');
		}
		console.log(`Files added, creating archive...`);
		return zip.generateAsync({type : "blob", streamFiles: true}, (meta) => counter.zip.val = meta.percent);
	}
	
	await fetchBlobs(src)
	.then((b) => pack(b))
	.then((zipFile) => {
		console.log(`All ${media}s fetched & zipped, saving file as ${filename}!`);
		saveAs(zipFile, filename||'unnamed.zip');
		launchProgress('end');
	});
	return true;
}

let currentBar;

const launchProgress = async (phase='campaignData') => {
	let hrc = document.getElementsByTagName('hr');
	if (phase === 'end') {
		document.getElementById('export-image-options-div').style.display = '';
		document.getElementById('export-campaign-div').style.display = '';
		document.getElementById('export-current-page-images-div').style.display = '';
		document.getElementById('export-other-outer').style.display = '';
		document.getElementById('export-image-options-div-2').style.display = '';
		for (let i=0;i<hrc.length;i++) {hrc[i].style.display = ''}
	
		document.getElementById('export-bar').style.display = 'none';

		document.getElementById('export-progress-span').innerText = '';

		if (currentBar) clearInterval(currentBar);
		document.getElementById('export-progress').style.width = '0%';
		counter.campaignData.val = 0;
		counter.fetch.val = 0;
		counter.zip.val = 0;
		return;
	}

	document.getElementById('export-image-options-div').style.display = 'none';
	document.getElementById('export-campaign-div').style.display = 'none';
	document.getElementById('export-current-page-images-div').style.display = 'none';
	document.getElementById('export-other-outer').style.display = 'none';
	document.getElementById('export-image-options-div-2').style.display = 'none';
	for (let i=0;i<hrc.length;i++) {hrc[i].style.display = 'none'}

	document.getElementById('export-bar').style.display = 'block';

	document.getElementById('export-progress').style.width = '0%';

	if (currentBar) clearInterval(currentBar);

	if (phase === 'campaignData') {
		document.getElementById('export-progress-span').innerText = 'Processing Campaign data...';
		counter[phase].max = 
			Campaign.pages.models.length * 10 +
			Campaign.characters.models.length * 5 +
			Campaign.handouts.models.length * 5 +
			Campaign.rollabletables.models.length +
			Campaign.players.models[0].macros.models.length
	} else if (phase === 'fetch') {
		counter[phase].max = imageQueue.length;
		document.getElementById('export-progress-span').innerText = 'Fetching images...';
	} else if (phase === 'zip') {
		counter[phase].max = 100;
		document.getElementById('export-progress-span').innerText = 'Zipping images... patience, Michelangelo!';
	}

	//console.log(`=== counter max is ${counter[phase].max}`);

	currentBar = setInterval(() => {
		let progress = counter[phase].val / counter[phase].max * 100
		document.getElementById('export-progress').style.width = `${parseInt(progress,10)}%`;
	}, 100)
}
