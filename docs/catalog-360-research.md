# Official catalog 360° research — 21 October 2026

Result: no verified, usable product-specific rotation sequence was found in this search. No catalog rows, photos or production settings were changed.

All 59 source product pages across the 13 editorial suppliers returned HTTP 200 and were inspected for product rotation players, frame sequences, 3D model assets and embeds. The structured audit is in `data/catalog-360-audit.json`. It records exact product/source URLs, HTTP status, timestamps and content hashes without copying full supplier pages into the repository.

This is a bounded inspection of public pages, not proof that unpublished assets do not exist. Dynamic viewers or resources available only through supplier portals may remain undiscovered.

## Findings and exclusions

- The five BH Fitness catalog pages load the Smart Product Viewer JavaScript/CSS globally. None exposed a product-specific rotation configuration or frame sequence. A globally installed viewer does not establish that rotation images exist for a given product.
- BH Fitness's official BU1000 page has a 360° section, but this model is absent from our 59-product catalog. Its assets must not be attached to H899, H889, R899, G699 or SC700.
- The exact inSPORTline UB60i manufacturer page was also inspected; no verified rotation sequence was identified.
- The Technogym Run Personal manufacturer page returned HTTP 403, so availability could not be verified. Access restrictions were not bypassed.
- Search results also included third-party paid 3D renderings, virtual tours of gyms and references to mechanical rotation, training features or shop names containing “360”. These do not qualify as supplier-provided rotation media for the exact listed product.
- For second-hand listings, a manufacturer rendering would describe the model, not establish the condition of the individual used item. Any future such media needs that distinction in the interface.

## Sources

- [BH Fitness R899](https://bh.fitness/en/equipment/cardiovascular/hiit-cardiovascular/hiitrower-r899/)
- [BH Fitness BU1000 — excluded, different model](https://bh.fitness/en/equipment/cardiovascular/movemia-cardiovascular/bu1000/)
- [inSPORTline UB60i manufacturer page](https://www.insportline.de/8973/insportline-incondi-ub60i-ergometer)
- [Technogym Run Personal — access blocked](https://www.technogym.com/en-US/product/run-personal_D947.html)

To activate genuine rotation for these models, obtain an ordered supplier photo sequence or an official embeddable presentation that can be verified against the exact model. The application already supports ordered sequences of at least 12 images. No supplier was contacted during this research.
