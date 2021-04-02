# r20Exporter
Export campaign from Roll20, to be imported into Foundry VTT using r20Importer.

Chrome extension for exporting whole campaigns from Roll20.

Install as temporary Unpacked Extension in chrome://extensions/

Options:
  - Export Images & Audio as .zip: 
      exports all images and audio tracks as two zip files. Some Images seem to
      throw CORS errors, unsure of fix.
      
  - Export assets to use local images
      tag the campaign.JSON entities (characters, tokens etc) to point to locally 
      stored images, filenames derived from Amazon storage keys.
      
  - Export blobs
      Export bio, defaulttoken and GMNotes fields for tokens/characters. These all
      require GM access to read from server.
