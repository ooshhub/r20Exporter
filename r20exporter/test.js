Campaign.activePage().thegraphics.models.map((tok) => {
    if (tok.attributes.imgsrc) {
        console.log(tok.attributes.imgsrc, tok.attributes.name);
    }
});