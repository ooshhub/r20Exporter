/* globals chrome, browser*/
//console.clear();

const extName = 'r20export-scripts';
const version = '0.7.5';
let b;
const extVer = 'firefox'; // eslint-disable-line no-unused-vars
console.log(`-== ${extName} ==-`,'\n',`v${version}`);

if (document.getElementById(extName)) document.head.removeChild(extName);

const scriptBlock = document.createElement("div");
scriptBlock.id = extName;

const createScript = (filename, element = scriptBlock) => {
    let script = document.createElement("script");
    b = chrome || browser;
    script.src = b.extension.getURL(filename);
    script.type = 'text/javascript';
    script.onload = () => { script.remove(); };
	element.appendChild(script);
	console.log(`  injecting ${filename}...`)
}

const loadScripts = () => {
    let docHead = document.head || document.getElementsByTagName('head')[0];
    createScript('./utils/FileSaver.js');
    createScript('./utils/jszip.js');
    createScript('./scripts/exportObjectsAsync.js');
    createScript('./scripts/exportHelpers.js');
	console.log('==================', '\n', 'Appending scriptblock...');
	docHead.appendChild(scriptBlock);
}


{
    const placementRoot = document.getElementById("editor-wrapper");
    const root = document.createElement("div");
    root.style = "width: 25%; z-index: 10501;";
    root.style.backgroundColor = "#ffffff";
    root.style.maxWidth = "30%";
    root.style.right = "25%";
    root.style.top = "10%";
    root.style.position = "absolute";
    root.style.padding = "10px";
    root.style.border = "3px solid darkred";
    root.style.display = "block"
    root.className = "export-modal";
    root.id = "export-modal";

    const hr = (parent) => {parent.appendChild(document.createElement('hr'))};
    const br = document.createElement('br');

    {
        const header = document.createElement("div");
            header.id = "export-header";
            header.style = "padding: 10px; cursor: move; background-color: darkred; color: white; display: block";
                const span = document.createElement("span");
                    span.id = "export-header-title";
                    span.innerText = "Oosh's Roll20 Exporter";
                    header.appendChild(span);
        root.appendChild(header);
    }
    {
        const body = document.createElement("div");
            body.className = "export-body";
            body.style.display = "block";
            body.id = "modal-body";

            { // SUBHEADER
                const p = document.createElement("p");
                p.className = 'export-sub-header'
                p.innerText = `Version ${version}`
                body.appendChild(p);
            }

            hr(body);

            { // IMAGE EXPORT OPTIONS
                const div = document.createElement('div');
                div.className = 'export-image-options';
                div.id = 'export-image-options-div';
                    const p = document.createElement("p");
                        const inputLabel = document.createElement("label");
                        inputLabel.htmlFor = "export-images";
                        inputLabel.className = "export-label";
                        inputLabel.innerHTML = "Export all images & audio as .zips?";
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.name = "export_images";
                        checkbox.id = "export-images";
                        checkbox.className = "export-checkbox";
                        checkbox.checked = false;
                        p.appendChild(inputLabel);
                        p.appendChild(br);
                        p.appendChild(checkbox);
                    div.appendChild(p);
                    const p2 = document.createElement("p");
                        p2.id = 'export-images-p';
                        const inputLabel2 = document.createElement("label");
                        inputLabel2.htmlFor = "export-images-type";
                        inputLabel2.className = "export-label";
                        inputLabel2.innerHTML = "Export assets to use local images?";
                        const checkbox2 = document.createElement("input");
                        checkbox2.type = "checkbox";
                        checkbox2.name = "export_images_type";
                        checkbox2.id = "export-images-type";
                        checkbox2.className = "export-checkbox";
                        checkbox2.checked = false;
                        p2.appendChild(inputLabel2);
                        p2.appendChild(br);
                        p2.appendChild(checkbox2);
                    div.appendChild(p2);
                    const p3 = document.createElement("p");
                        const inputLabel3 = document.createElement("label");
                            inputLabel3.htmlFor = "export-blobs";
                            inputLabel3.className = "export-label";
                            inputLabel3.innerHTML = "Export Blobs? (GM notes etc... Requires GM)<br>";
                        const checkbox3 = document.createElement("input");
                            checkbox3.type = "checkbox";
                            checkbox3.name = "export_blobs";
                            checkbox3.id = "export-blobs";
                            checkbox3.className = "export-checkbox";
                            checkbox3.checked = false;
                        p3.appendChild(inputLabel3);
                        p3.appendChild(br);
                        p3.appendChild(checkbox3);
                    div.appendChild(p3);
                body.appendChild(div);
            }
            hr(body);
            {
                const div = document.createElement('div');
                div.className = 'export-image-options-2';
                div.id = 'export-image-options-div-2';
                    const p = document.createElement("p");
                        const inputLabel = document.createElement("label");
                        inputLabel.htmlFor = "export-images-hires";
                        inputLabel.className = "export-label";
                        inputLabel.innerHTML = "Attempt to force hi-res image download?";
                        const select = document.createElement('select');
                        select.id = 'export-images-hires';
                        select.className = 'export-select';
                            const opt1 = document.createElement('option');
                            opt1.text = 'Disabled';
                            opt1.value = 'off';
                            opt1.selected = true;
                            const opt2 = document.createElement('option');
                            opt2.text = 'All Images';
                            opt2.value = 'on';
                            const opt3 = document.createElement('option');
                            opt3.text = 'Map Only';
                            opt3.value = 'map';
                        select.add(opt1);
                        select.add(opt2);
                        select.add(opt3);
                    p.appendChild(inputLabel);
                    p.appendChild(select);
                div.appendChild(p);
                body.appendChild(div);
            }

            hr(body);

            { // EXPORT CAMPAIGN DIV
                const div = document.createElement('div'); 
                    div.className = 'export-campaign';
                    div.id = 'export-campaign-div';
                        const p = document.createElement("p");
                            const btn = document.createElement("button");
                            btn.id = "export-campaign";
                            btn.innerText = "Export full Campaign!";
                            btn.className = "export-btn";
                            const tip = document.createElement("span");
                            tip.innerHTML = "Export full campaign";
                            p.appendChild(btn);
                        div.appendChild(p);
                body.appendChild(div);
            }

            hr(body);

            { // EXPORT CURRENT PAGE IMAGES
                const div = document.createElement('div'); 
                    div.className = 'export-campaign';
                    div.id = 'export-current-page-images-div';
                        const p = document.createElement("p");
                            const btn = document.createElement("button");
                            btn.id = "export-current-page-images";
                            btn.innerText = "Export images for active canvas";
                            btn.className = "export-btn";
                            const tip = document.createElement("span");
                            tip.innerHTML = "Export images";
                            const span = document.createElement('span');
                            span.className = 'export-label';
                            span.innerText = 'If you have maps displaying with low res images, try using this on a page-by-page basis to download images for the active canvas. Seems to be more likely to succeed with higher-res files from Amazon buckets.';
                            p.appendChild(btn);
                            p.appendChild(br);

                        div.appendChild(p);
                body.appendChild(div);
            }

            hr(body);

            { // OTHER EXPORT OPTIONS
                const outerDiv = document.createElement('div');
                outerDiv.id = 'export-other-outer';
                outerDiv.className = 'export-other';
                    const span = document.createElement('span');
                    span.id = 'export-other-text';
                    span.innerText = "Deprecated functions...   ";
                    const label1 = document.createElement('label');
                    label1.className = "export-label";
                    label1.innerHTML = ' Show';
                    label1.htmlFor = 'export-other-show';
                    const radio1 = document.createElement('input');
                    radio1.type = 'radio';
                    radio1.name = 'exportOtherOptions';
                    radio1.id = 'export-other-show';
                    radio1.value = 'show';
                    const label2 = document.createElement('label');
                    label2.className = "export-label";
                    label2.innerHTML = ' Hide';
                    label2.htmlFor = 'export-other-hide';
                    const radio2 = document.createElement('input');
                    radio2.type = 'radio';
                    radio2.name = 'exportOtherOptions';
                    radio2.id = 'export-other-hide';
                    radio2.value = 'hide';
                    radio2.checked = true;
                outerDiv.appendChild(span);
                outerDiv.appendChild(radio1);
                outerDiv.appendChild(label1);
                outerDiv.appendChild(radio2);
                outerDiv.appendChild(label2);
                    {
                    const div = document.createElement('div');
                        div.className = 'export-other';
                        div.id = 'export-other-div';
                            const p = document.createElement('p');
                                p.className = 'export-other-p';
                                const btn = document.createElement("button");
                                    btn.id = "export-characters";
                                    btn.innerText = "Export Characters";
                                    btn.className = "export-btn";
                                p.appendChild(btn);
                                const btn2 = document.createElement("button");
                                    btn2.id = "export-handouts";
                                    btn2.innerText = "Export Handouts";
                                    btn2.className = "export-btn";
                                p.appendChild(btn2);
                            div.appendChild(p);
                            const p2 = document.createElement("p");
                                const inputLabel3 = document.createElement("label");
                                    inputLabel3.htmlFor = "limit-number";
                                    inputLabel3.className = "export-label";
                                    inputLabel3.innerHTML = "Limit Handout/Character/Page export cycles (-1 no limit):<br>";
                                p2.appendChild(inputLabel3);
                                const numberInput = document.createElement("input");
                                    numberInput.type = "number";
                                    numberInput.id = "limit-number";
                                    numberInput.className = "export-number";
                                    numberInput.defaultValue = "1";
                                    numberInput.min = "-1";
                                    numberInput.max = "100";
                                p2.appendChild(numberInput);
                            div.appendChild(p2);
                            hr(div);
                            const p3 = document.createElement("p");
                                const btn3 = document.createElement("button");
                                    btn3.id = "export-pages";
                                    btn3.innerText = "Export Page(s)";
                                    btn3.className = "export-btn";
                                p3.appendChild(btn3);
                                p3.appendChild(br);
                                const numberInput3 = document.createElement("input");
                                    numberInput3.type = "number";
                                    numberInput3.id = "page-number";
                                    numberInput3.innerText = "Page Number";
                                    numberInput3.className = "export-number";
                                    numberInput3.defaultValue = "0";
                                    numberInput3.min = "-1";
                                    numberInput3.max = "1000";
                                p3.appendChild(numberInput3);
                                const tip = document.createElement("span");
                                    tip.className = "export-text"
                                    tip.innerHTML = "Index to export (Set to -1 for 'all')";
                                p3.appendChild(tip);
                            div.appendChild(p3);
                    outerDiv.appendChild(div);
                    }
                body.appendChild(outerDiv)
            }

            hr(body);

            { // PROGRESS BAR
            const div = document.createElement('div');
            div.id = 'export-progress-outer-div';
                const divB = document.createElement('div');
                divB.className = 'export-bar';
                divB.id = 'export-bar';
                        const divInner = document.createElement('div');
                        divInner.className = 'export-progress';
                        divInner.id = 'export-progress';
                            const span = document.createElement('span');
                            span.id = ('export-progress-span');
                            span.className = 'export-progess-label';
                            span.innerText = '';
                        divB.appendChild(divInner);
                div.appendChild(divB);
                div.appendChild(br);
                div.appendChild(span);
            body.appendChild(div);   
            }
            
        root.appendChild(body);
    }
    placementRoot.parentElement.insertBefore(root, placementRoot);
}

const init = () => {
    setTimeout(() => {
            console.log(`Loading scripts...`, '\n', '==================');
            loadScripts();
    }, 2000);
};

if (document.readyState === 'complete') init()
else document.body.onload = () => init();

let radios = document.getElementsByName('exportOtherOptions')
radios.forEach(r => {
    r.addEventListener('change', (ev) => {
        console.log(ev.target.value);
        if (ev.target.value === 'show') document.getElementById('export-other-div').style.display = 'block';
        else if (ev.target.value === 'hide') document.getElementById('export-other-div').style.display = 'none';
    });
});

