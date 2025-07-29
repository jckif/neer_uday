// Interactive Map for JCKIF NEER UDAY Project
class InteractiveMap {
    constructor(mapElementId, mapData) {
        this.mapElementId = mapElementId;
        this.mapData = mapData;
        this.map = null;
        this.districtMarkers = [];
        this.villageMarkers = [];
        this.currentDistrict = null;
        this.infoPanel = null;
        this.indiaLayer = null;
        this.zoomThreshold = 9; // Show villages at zoom >= 9
        this.isClearingVillages = false;
        this.init();
    }

    async init() {
        // Initialize the map centered on Rajasthan
        this.map = L.map(this.mapElementId).setView([23.5937, 80.9629], 5.2);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add India outline
        await this.addIndiaOutline();
        
        // Create info panel
        this.createInfoPanel();
        
        // Add district markers
        this.addDistrictMarkers();
        
        // Add zoom control
        this.addZoomControl();

        // Listen for zoom events to hide/show villages
        this.map.on('zoomend', () => this.onZoomChange());

        // For polygon outline
        this.districtPolygon = null;
    }

    async addIndiaOutline() {
        // High-quality India country boundary GeoJSON
        const url = 'https://raw.githubusercontent.com/wri/wri-bounds/master/dist/in_country_boundaries.geojson';
        try {
            const response = await fetch(url);
            const geojson = await response.json();
            // Filter to only the India feature if needed (sometimes these files have multiple countries)
            let indiaFeature = geojson;
            if (geojson.type === 'FeatureCollection') {
                indiaFeature = {
                    type: 'FeatureCollection',
                    features: geojson.features.filter(f => {
                        // Try to match by ISO code or name
                        return (f.properties && (f.properties.iso_a2 === 'IN' || f.properties.name === 'India'));
                    })
                };
            }
            this.indiaLayer = L.geoJSON(indiaFeature, {
                style: {
                    color: '#000',
                    weight: 2,
                    fill: false,
                    className: 'india-outline'
                }
            }).addTo(this.map);
            // Fit map to India outline
            this.map.fitBounds(this.indiaLayer.getBounds());
        } catch (e) {
            console.warn('Could not load India outline:', e);
        }
    }

    createInfoPanel() {
        // Create info panel container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'map-info-panel';
        infoContainer.innerHTML = `
            <div class="info-header">
                <h3>NEER UDAY Project Coverage</h3>
                <button class="close-info" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
            <div class="info-content">
                <p>Click on a district to explore villages where our student teams have conducted water conservation studies.</p>
                <div class="district-info" style="display: none;">
                    <h4 class="district-name"></h4>
                    <p class="district-description"></p>
                    <div class="village-list"></div>
                </div>
            </div>
        `;
        
        // Insert info panel into map container
        const mapContainer = document.getElementById(this.mapElementId);
        mapContainer.parentNode.insertBefore(infoContainer, mapContainer.nextSibling);
        
        this.infoPanel = infoContainer;
    }

    addDistrictMarkers() {
        this.districtMarkers = [];
        this.mapData.districts.forEach(district => {
            // Create custom district marker
            const districtIcon = L.divIcon({
                className: 'custom-district-marker',
                html: `
                    <div class="district-marker">
                        <div class="marker-pulse"></div>
                        <div class="marker-dot"></div>
                        <span class="marker-label">${district.name}</span>
                    </div>
                `,
                iconSize: [60, 60],
                iconAnchor: [30, 30]
            });

            const marker = L.marker(district.coordinates, { icon: districtIcon })
                .addTo(this.map)
                .on('click', () => this.onDistrictClick(district))
                .on('mouseover', () => this.onDistrictHover(district))
                .on('mouseout', () => this.onDistrictHoverOut());

            this.districtMarkers.push(marker);
        });
    }

    onDistrictClick(district) {
        this.clearVillageMarkers();
        this.currentDistrict = district;
        this.map.setView(district.coordinates, 11, { animate: true });
        this.addVillageMarkers(district);
        this.updateInfoPanel(district);
        // Hide all district markers
        this.districtMarkers.forEach(marker => marker.remove());
        // Remove any village info panel if present
        let villageInfo = this.infoPanel.querySelector('.village-info');
        if (villageInfo) villageInfo.remove();
    }

    addVillageMarkers(district) {
        // Prevent adding if clearing is in progress
        if (this.isClearingVillages) return;
        this.villageMarkers = [];
        const centroid = district.coordinates;
        district.villages.forEach(village => {
            // Create custom village marker
            const villageIcon = L.divIcon({
                className: 'custom-village-marker',
                html: `
                    <div class="village-marker">
                        <div class="village-dot"></div>
                        <span class="village-label">${village.name}</span>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            // Start marker at centroid
            const marker = L.marker(centroid, { icon: villageIcon }).addTo(this.map)
                .on('click', () => this.onVillageClick(village));
            this.villageMarkers.push(marker);
            // Animate marker to village location
            this.animateMarkerMove(marker, centroid, village.coordinates, 1200); // 1.2s slow smooth
        });
    }

    onVillageClick(village) {
        // Remove Leaflet popup, only update info panel
        this.updateVillageInfoPanel(village);
    }

    updateVillageInfoPanel(village) {
        const districtInfo = this.infoPanel.querySelector('.district-info');
        districtInfo.style.display = 'none';
        let villageInfo = this.infoPanel.querySelector('.village-info');
        if (villageInfo) villageInfo.remove();
        villageInfo = document.createElement('div');
        villageInfo.className = 'village-info';
        // Special tabbed UI for Ratangarh
        if (village.id === 'ratangarh') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                    <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                    <div class="ratangarh-image-row" style="height:100%;"></div>
                    <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                </div>
                <div class="ratangarh-tabs">
                    <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                    <button class="ratangarh-tab" data-tab="history">📜 History</button>
                    <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                    <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                    <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                    <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                    <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                </div>
                <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => { // Wait for DOM
                // Insert images into the image row
                const images = [
                    {src: 'images/ratangarh/9.jpg', caption: 'Visit Ratangarh for the traditional water body.'},
                    {src: 'images/ratangarh/3.jpg', caption: 'Sethani Ka Johar - community engagement.'},
                    {src: 'images/ratangarh/10.jpg', caption: 'Sethani Ka Johar - historic reservoir.', viewAll: true}
                ];
                const imageRow = villageInfo.querySelector('.ratangarh-image-row');
                images.forEach((img, i) => {
                    const box = document.createElement('div');
                    box.className = 'ratangarh-img-box';
                    box.innerHTML = `<img src='${img.src}' alt='Ratangarh Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                    if (img.viewAll) {
                        const btn = document.createElement('a');
                        btn.href = 'ratangarh.html';
                        btn.className = 'view-all-photos-btn';
                        btn.textContent = 'View All Photos';
                        box.appendChild(btn);
                    }
                    imageRow.appendChild(box);
                });
                // Arrow logic
                let currentIndex = 0;
                const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
                const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
                function updateArrows() {
                    leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                    rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
                }
                function scrollToIndex(idx) {
                    const box = imageRow.children[idx];
                    if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                    currentIndex = idx;
                     updateArrows();
                }
                leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                imageRow.addEventListener('scroll', () => {
                    // Find the most visible image
                    let minDist = Infinity, idx = 0;
                    for (let i=0; i<imageRow.children.length; ++i) {
                        const rect = imageRow.children[i].getBoundingClientRect();
                        const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                        if (dist < minDist) { minDist = dist; idx = i; }
                    }
                    currentIndex = idx;
                    updateArrows();
                });
                // Initial state
                scrollToIndex(0);
                // Tabs logic (unchanged)
                const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
                const tabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Ratangarh & Sethani Ka Johar</td></tr>
                            <tr><th>District</th><td>Churu</td></tr>
                            <tr><th>Latitude</th><td>28.070647</td></tr>
                            <tr><th>Longitude</th><td>74.624009</td></tr>
                        </table>
                        Ratangarh & Sethani Ka Johar is a historic water reservoir in Churu, Rajasthan, built in 1899 by Sethani Bhagwati Devi. It is a symbol of community-driven water conservation and local heritage.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History</b><br/>Sethani ka Johad was built around 1899 by Sethani Bhagwati Devi, a philanthropist from the Oswal Jain community. Constructed during a devastating famine, the johad served dual purposes—providing water and employment. It is a symbol of community-driven water conservation.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Drinking Water: Still used by nearby residents, especially during dry months.</li><li>Social Hub: A site for local gatherings, especially during festivals.</li><li>Environmental Role: Plays a vital part in groundwater recharge.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>While not a temple tank, it is locally revered due to its historical and charitable origins. Occasionally used for ritual bathing during religious events.<br/><br/>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Architectural Heritage: Traditional Rajasthani design with elegant step formations.</li><li>Eco-Tourism Opportunity: Can be part of a heritage water trail in Churu.</li><li>Cultural Insight: Tells the story of women's leadership in water conservation.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Rainwater Harvesting Design: Sloped catchments, sediment filters, and seepage control.</li><li>Material Use: Built with lime plaster and local sandstone, offering durability and cooling.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Storage: Fills during monsoon, retains water for 6–8 months depending on rainfall.</li><li>Water Quality: Fair for livestock; needs regular desilting and cleanup.</li><li>Maintenance Status: Largely community-maintained, with occasional NGO support.</li></ul>`
                };
                function setTab(tab) {
                    tabContent.innerHTML = tabData[tab];
                    villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                    villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                }
                setTab('overview');
                villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
                    btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                });
            }, 0);
        }
        else if (village.id === 'salawas') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                    <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                    <div class="ratangarh-image-row" style="height:100%;"></div>
                    <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                </div>
                <div class="ratangarh-tabs">
                    <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                    <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
                    <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                    <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                    <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                    <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                    <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                </div>
                <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => { // Wait for DOM
                // Insert images into the image row
                const images = [
                    {src: 'images/salawas/1.jpg', caption: 'Joon ki Bawadi – Salawas, Jodhpur'},
                    {src: 'images/salawas/2.jpg', caption: 'Traditional stepwell structure, partially submerged.'},
                    {src: 'images/salawas/3.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const imageRow = villageInfo.querySelector('.ratangarh-image-row');
                images.forEach((img, i) => {
                    const box = document.createElement('div');
                    box.className = 'ratangarh-img-box';
                    box.innerHTML = `<img src='${img.src}' alt='Salawas Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                    if (img.viewAll) {
                        const btn = document.createElement('a');
                        btn.href = 'salawas.html';
                        btn.className = 'view-all-photos-btn';
                        btn.textContent = 'View All Photos';
                        box.appendChild(btn);
                    }
                    imageRow.appendChild(box);
                });
                // Arrow logic
                let currentIndex = 0;
                const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
                const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
                function updateArrows() {
                    leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                    rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
                }
                function scrollToIndex(idx) {
                    const box = imageRow.children[idx];
                    if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                    currentIndex = idx;
                    updateArrows();
                }
                leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                imageRow.addEventListener('scroll', () => {
                    // Find the most visible image
                    let minDist = Infinity, idx = 0;
                    for (let i=0; i<imageRow.children.length; ++i) {
                        const rect = imageRow.children[i].getBoundingClientRect();
                        const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                        if (dist < minDist) { minDist = dist; idx = i; }
                    }
                    currentIndex = idx;
                    updateArrows();
                });
                // Initial state
                scrollToIndex(0);
                // Tabs logic
                const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
                const tabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Joon ki Bawadi, Salawas</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.121780</td></tr>
                            <tr><th>Longitude</th><td>72.998051</td></tr>
                        </table>
                        Joon ki Bawadi is a traditional stepwell located in Salawas village, part of Luni tehsil in Jodhpur district, Rajasthan.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Joon ki Bawadi is a traditional stepwell located in Salawas village, part of Luni tehsil in Jodhpur district, Rajasthan. While formal documentation is limited, local oral traditions suggest that the bawadi was commissioned or maintained by the Joon family, a respected lineage in the village. It was constructed to serve the water needs of the local community in an otherwise arid zone.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Not in Active Use: The bawadi is no longer used as a functional water source by the community.</li><li>Partially Submerged: A portion of the bawadi has been submerged due to overflow from the nearby river, especially during the monsoon.</li><li>Partially Visible: Only some parts of the stepwell structure are still visible; the rest has been overtaken by silt and encroachment.</li><li>Neglected by Locals: With the arrival of modern water supply systems, locals no longer depend on this traditional water source.</li><li>No Livestock Access: The water is stagnant and inaccessible, even for animals.</li><li>No Community Engagement: Once a community space, it is now abandoned and disconnected from village activities.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Though not attached to a temple, it is locally respected for its historic value. Villagers occasionally perform ritual cleansing or offerings near the bawadi during festivals like Gangaur or Teej.<br/><br/>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Cultural Link: Located near Salawas, a village known for handwoven dhurries and artisan tours.</li><li>Potential Heritage Stop: Could be included in rural craft and water heritage trails if cleaned and promoted properly.</li><li>Photo-worthy site: Its rustic Rajasthani architecture and quiet surroundings attract heritage photographers.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Design: Follows the traditional multi-step baori architecture, with sandstone steps leading down to the water level.</li><li>Sustainable Engineering: Rainwater collection and natural filtration through sand layers help preserve water quality.</li><li>Cooling Feature: Its deep construction keeps the water cool year-round, reducing evaporation losses.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: Holds water during and after the monsoon; remains useful for about 4–5 months annually.</li><li>Water Quality: worse quality—suitable for livestock and irrigation but needs testing for drinking.</li><li>Maintenance Status: Currently in a semi-neglected state; overgrown with weeds and partially silted. Desilting and fencing would restore its functionality.</li></ul>`
                };
                function setTab(tab) {
                    tabContent.innerHTML = tabData[tab];
                    villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                    villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                }
                setTab('overview');
                villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
                    btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                });
            }, 0);
        }
        
        else if (village.id === 'osian') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                    <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                    <div class="ratangarh-image-row" style="height:100%;"></div>
                    <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                </div>
                <div class="ratangarh-tabs">
                    <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                    <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
                    <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                    <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                    <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                    <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                    <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                </div>
                <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => { // Wait for DOM
                // Insert images into the image row
                const images = [
                    {src: 'images/salawas/1.jpg', caption: 'Joon ki Bawadi – Salawas, Jodhpur'},
                    {src: 'images/salawas/2.jpg', caption: 'Traditional stepwell structure, partially submerged.'},
                    {src: 'images/salawas/3.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const imageRow = villageInfo.querySelector('.ratangarh-image-row');
                images.forEach((img, i) => {
                    const box = document.createElement('div');
                    box.className = 'ratangarh-img-box';
                    box.innerHTML = `<img src='${img.src}' alt='Salawas Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                    if (img.viewAll) {
                        const btn = document.createElement('a');
                        btn.href = 'salawas.html';
                        btn.className = 'view-all-photos-btn';
                        btn.textContent = 'View All Photos';
                        box.appendChild(btn);
                    }
                    imageRow.appendChild(box);
                });
                // Arrow logic
                let currentIndex = 0;
                const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
                const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
                function updateArrows() {
                    leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                    rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
                }
                function scrollToIndex(idx) {
                    const box = imageRow.children[idx];
                    if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                    currentIndex = idx;
                    updateArrows();
                }
                leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                imageRow.addEventListener('scroll', () => {
                    // Find the most visible image
                    let minDist = Infinity, idx = 0;
                    for (let i=0; i<imageRow.children.length; ++i) {
                        const rect = imageRow.children[i].getBoundingClientRect();
                        const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                        if (dist < minDist) { minDist = dist; idx = i; }
                    }
                    currentIndex = idx;
                    updateArrows();
                });
                // Initial state
                scrollToIndex(0);
                // Tabs logic
                const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
                const tabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Joon ki Bawadi, Salawas</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.121780</td></tr>
                            <tr><th>Longitude</th><td>72.998051</td></tr>
                        </table>
                        Joon ki Bawadi is a traditional stepwell located in Salawas village, part of Luni tehsil in Jodhpur district, Rajasthan.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Joon ki Bawadi is a traditional stepwell located in Salawas village, part of Luni tehsil in Jodhpur district, Rajasthan. While formal documentation is limited, local oral traditions suggest that the bawadi was commissioned or maintained by the Joon family, a respected lineage in the village. It was constructed to serve the water needs of the local community in an otherwise arid zone.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Not in Active Use: The bawadi is no longer used as a functional water source by the community.</li><li>Partially Submerged: A portion of the bawadi has been submerged due to overflow from the nearby river, especially during the monsoon.</li><li>Partially Visible: Only some parts of the stepwell structure are still visible; the rest has been overtaken by silt and encroachment.</li><li>Neglected by Locals: With the arrival of modern water supply systems, locals no longer depend on this traditional water source.</li><li>No Livestock Access: The water is stagnant and inaccessible, even for animals.</li><li>No Community Engagement: Once a community space, it is now abandoned and disconnected from village activities.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Though not attached to a temple, it is locally respected for its historic value. Villagers occasionally perform ritual cleansing or offerings near the bawadi during festivals like Gangaur or Teej.<br/><br/>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Cultural Link: Located near Salawas, a village known for handwoven dhurries and artisan tours.</li><li>Potential Heritage Stop: Could be included in rural craft and water heritage trails if cleaned and promoted properly.</li><li>Photo-worthy site: Its rustic Rajasthani architecture and quiet surroundings attract heritage photographers.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Design: Follows the traditional multi-step baori architecture, with sandstone steps leading down to the water level.</li><li>Sustainable Engineering: Rainwater collection and natural filtration through sand layers help preserve water quality.</li><li>Cooling Feature: Its deep construction keeps the water cool year-round, reducing evaporation losses.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: Holds water during and after the monsoon; remains useful for about 4–5 months annually.</li><li>Water Quality: worse quality—suitable for livestock and irrigation but needs testing for drinking.</li><li>Maintenance Status: Currently in a semi-neglected state; overgrown with weeds and partially silted. Desilting and fencing would restore its functionality.</li></ul>`
                };
                function setTab(tab) {
                    tabContent.innerHTML = tabData[tab];
                    villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                    villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                }
                setTab('overview');
                villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
                    btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                });
            }, 0);
        }

        else if (village.id === 'mathania') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="mathania-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
                    <button class="mathania-main-tab active" data-main-tab="katan">Katan Bawadi</button>
                    <button class="mathania-main-tab" data-main-tab="karni">Karni Mata Mandir Bawadi</button>
                </div>
                <div class="mathania-bawadi-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => {
                // Images for Mathania
                const images = [
                    {src: 'images/mathania/1.jpg', caption: 'Katan Bawadi – Mathania, Rajasthan'},
                    {src: 'images/mathania/2.jpg', caption: 'Traditional stepwell structure, Mathania.'},
                    {src: 'images/mathania/3.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const karniImages = [
                    {src: 'images/mathania/4.jpg', caption: 'Karni Mata Mandir Bawadi – Mathania'},
                    {src: 'images/mathania/5.jpg', caption: 'Sacred stepwell near Karni Mata Mandir.'},
                    {src: 'images/mathania/6.jpg', caption: 'Present condition of the Mandir Bawadi.', viewAll: true}
                ];
                // Tab content for Katan Bawadi
                const katanTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Katan Bawadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Katan Bawadi is a traditional stepwell located in Rajasthan, believed to be constructed during the late medieval period (likely between the 17th and 18th centuries).<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Katan Bawadi is a traditional stepwell located in Rajasthan, believed to be constructed during the late medieval period (likely between the 17th and 18th centuries). Stepwells like Katan Bawadi were built by local rulers, wealthy merchants, or community leaders as a solution to the arid climate and irregular monsoons. These structures served both utilitarian and cultural purposes and were a vital part of water management systems in the region.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Farming: The water from Katan Bawadi was traditionally used for nearby agricultural lands, particularly for kharif crops during post-monsoon months.</li><li>Drinking Water: Historically, it was a reliable source of drinking water, especially during dry months.</li><li>Social Gathering: The stepwell once served as a community space where villagers gathered, especially women fetching water, creating a vibrant social environment.</li><li>Current Status: In present times, the bawadi is not actively used. Water is often stagnant or seasonal, and some parts are either filled with silt or debris.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Like many stepwells in Rajasthan, Katan Bawadi may have religious or ritual value, especially during festivals like Gangaur or Teej, where women would offer prayers near water bodies. Some local legends may also associate the site with blessings of rain or fertility.<br/><br/>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Architectural Appeal: Its traditional stone-carved steps and symmetrical design can attract heritage and architecture enthusiasts.</li><li>Cultural Tourism: Can be included in rural heritage walks or water heritage circuits.</li><li>Eco-Tourism: With proper cleaning and interpretation signage, it could be a part of sustainable tourism models.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Design & Construction: Katan Bawadi represents ancient engineering that maximizes water percolation and minimizes evaporation.</li><li>Hydrological Efficiency: Its tiered construction allows water storage at multiple levels, adapting to both high and low rainfall years.</li><li>Material Use: Locally sourced sandstone helps in natural cooling of stored water.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: Holds very limited water now, mostly seasonal. After good rainfall, it can store water for about 2–3 months, depending on desilting status.</li><li>Water Quality: Due to neglect, current water may be unsafe for drinking without treatment. There is visible algal growth, and water may be contaminated due to nearby runoff or waste dumping.</li><li>Structural Condition: Some portions of the steps and walls are damaged or submerged, indicating the need for conservation.</li></ul>`
                };
                // Tab content for Karni Mata Mandir Bawadi
                const karniTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Karni Mata Mandir Bawadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Karni Mata Mandir Bawadi is a historic stepwell located near or within the vicinity of a temple dedicated to Karni Mata, the revered deity known as the "Mother of Miracles" in Rajasthan.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Karni Mata Mandir Bawadi is a historic stepwell located near or within the vicinity of a temple dedicated to Karni Mata, the revered deity known as the "Mother of Miracles" in Rajasthan. It was likely constructed several centuries ago by local rulers or devotees as part of temple infrastructure, aimed at providing water for both pilgrims and ritual use. It reflects the traditional integration of water conservation and spiritual architecture, a hallmark of Rajasthani temple complexes.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Religious Use: Occasionally used during rituals, holy days, and festivals linked to Karni Mata.</li><li>Drinking Water: Not currently used due to quality concerns.</li><li>Community Use: Rarely used; some nearby villagers may still wash or clean at the site.</li><li>Seasonal Storage: Still collects rainwater during monsoons, but is not maintained year-round.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Highly significant as it is attached to the Karni Mata temple.</li><li>Water might have been used for abhishek (ritual bathing of idols), pilgrim purification, and temple cooking.</li><li>Considered holy water by many local devotees, especially during fairs and religious processions.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Religious Tourism: Can attract pilgrims visiting the Karni Mata Mandir.</li><li>Cultural Heritage: Represents sacred water architecture.</li><li>Photo Tourism: Traditional carvings, temple-stepwell blend can attract tourists and photographers.</li><li>Eco-tourism: If restored, could be part of sustainable tourism circuits around temple towns.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Ritual-linked Design: The stepwell's design allowed easy access for large groups of pilgrims.</li><li>Sacred Geometry: May reflect Vastu Shastra principles in alignment with the temple.</li><li>Natural Cooling: Stone construction maintained cool temperatures, preserving water quality historically.</li><li>Rainwater Harvesting: Stepwells like this effectively harvested and stored monsoon water.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: worse— mainly collects monsoon rainwater, storage lasts 1–2 months without desilting.</li><li>Water Quality: Poor — stagnant water, algae, debris present.</li><li>Physical State: Walls may be partially submerged, cracked or broken steps, minimal maintenance.</li></ul><br/>Karni Mata Mandir Bawadi is not only a spiritual structure but a symbol of community water wisdom. Its revival can serve both faith and function, bridging devotion with conservation.`
                };
                // Render main tab content
                function renderBawadiTab(mainTab) {
                    const contentDiv = villageInfo.querySelector('.mathania-bawadi-content');
                    // Images and sub-tabs
                    const imgs = mainTab === 'katan' ? images : karniImages;
                    const tabData = mainTab === 'katan' ? katanTabData : karniTabData;
                    contentDiv.innerHTML = `
                        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                            <div class="ratangarh-image-row" style="height:100%;"></div>
                            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                        </div>
                        <div class="ratangarh-tabs">
                            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                            <button class="ratangarh-tab" data-tab="history">📜 History${mainTab==='karni' ? ' of the Waterbody' : ' of Waterbody'}</button>
                            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                        </div>
                        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                    `;
                    // Insert images
                    const imageRow = contentDiv.querySelector('.ratangarh-image-row');
                    imgs.forEach((img, i) => {
                        const box = document.createElement('div');
                        box.className = 'ratangarh-img-box';
                        box.innerHTML = `<img src='${img.src}' alt='Mathania Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                        if (img.viewAll) {
                            const btn = document.createElement('a');
                            btn.href = 'mathania.html';
                            btn.className = 'view-all-photos-btn';
                            btn.textContent = 'View All Photos';
                            box.appendChild(btn);
                        }
                        imageRow.appendChild(box);
                    });
                    // Arrow logic
                    let currentIndex = 0;
                    const leftArrow = contentDiv.querySelector('.ratangarh-arrow-left');
                    const rightArrow = contentDiv.querySelector('.ratangarh-arrow-right');
                    function updateArrows() {
                        leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                        rightArrow.style.display = currentIndex < imgs.length-1 ? 'flex' : 'none';
                    }
                    function scrollToIndex(idx) {
                        const box = imageRow.children[idx];
                        if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                        currentIndex = idx;
                        updateArrows();
                    }
                    leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                    rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                    imageRow.addEventListener('scroll', () => {
                        let minDist = Infinity, idx = 0;
                        for (let i=0; i<imageRow.children.length; ++i) {
                            const rect = imageRow.children[i].getBoundingClientRect();
                            const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                            if (dist < minDist) { minDist = dist; idx = i; }
                        }
                        currentIndex = idx;
                        updateArrows();
                    });
                    // Initial state
                    scrollToIndex(0);
                    // Sub-tabs logic
                    const tabContent = contentDiv.querySelector('#ratangarh-tab-content');
                    function setTab(tab) {
                        tabContent.innerHTML = tabData[tab];
                        contentDiv.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                        contentDiv.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                    }
                    setTab('overview');
                    contentDiv.querySelectorAll('.ratangarh-tab').forEach(btn => {
                        btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                    });
                }
                // Main tab logic
                let currentMainTab = 'katan';
                renderBawadiTab(currentMainTab);
                villageInfo.querySelectorAll('.mathania-main-tab').forEach(btn => {
                    btn.onclick = () => {
                        villageInfo.querySelectorAll('.mathania-main-tab').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentMainTab = btn.getAttribute('data-main-tab');
                        renderBawadiTab(currentMainTab);
                    };
                });
            }, 0);
        }
        
        else if (village.id === 'ramgarh') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                    <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                    <div class="ratangarh-image-row" style="height:100%;"></div>
                    <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                </div>
                <div class="ratangarh-tabs">
                    <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                    <button class="ramgarh-tab" data-tab="history">📜 History of the Waterbody</button>
                    <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                    <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                    <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                    <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                    <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                </div>
                <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => { // Wait for DOM
                // Insert images into the image row
                const images = [
                    {src: 'images/ramgarh/1.jpg', caption: 'Kshatriyoon ki Nadi – Ramgarh, Jaisalmer'},
                    {src: 'images/ramgarh/2.jpg', caption: 'Traditional rain-fed tank, Ramgarh.'},
                    {src: 'images/ramgarh/3.jpg', caption: 'Current state of the Nadi.', viewAll: true}
                ];
                const imageRow = villageInfo.querySelector('.ratangarh-image-row');
                images.forEach((img, i) => {
                    const box = document.createElement('div');
                    box.className = 'ratangarh-img-box';
                    box.innerHTML = `<img src='${img.src}' alt='Ramgarh Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                    if (img.viewAll) {
                        const btn = document.createElement('a');
                        btn.href = 'ramgarh.html';
                        btn.className = 'view-all-photos-btn';
                        btn.textContent = 'View All Photos';
                        box.appendChild(btn);
                    }
                    imageRow.appendChild(box);
                });
                // Arrow logic
                let currentIndex = 0;
                const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
                const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
                function updateArrows() {
                    leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                    rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
                }
                function scrollToIndex(idx) {
                    const box = imageRow.children[idx];
                    if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                    currentIndex = idx;
                    updateArrows();
                }
                leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                imageRow.addEventListener('scroll', () => {
                    // Find the most visible image
                    let minDist = Infinity, idx = 0;
                    for (let i=0; i<imageRow.children.length; ++i) {
                        const rect = imageRow.children[i].getBoundingClientRect();
                        const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                        if (dist < minDist) { minDist = dist; idx = i; }
                    }
                    currentIndex = idx;
                    updateArrows();
                });
                // Initial state
                scrollToIndex(0);
                // Tabs logic
                const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
                const tabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Kshatriyoon ki Nadi, Ramgarh</td></tr>
                            <tr><th>District</th><td>Jaisalmer</td></tr>
                            <tr><th>Latitude</th><td>27.374339</td></tr>
                            <tr><th>Longitude</th><td>70.494761</td></tr>
                        </table>
                        Kshatriyoon ki Nadi is a traditional water reservoir located in Ramgarh village, near Jaisalmer, Rajasthan. It was historically developed and maintained by Rajput (Kshatriya) communities as a seasonal river or large rain-fed tank.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Kshatriyoon ki Nadi (meaning "River of the Kshatriyas") is a traditional water reservoir located in Ramgarh village, near Jaisalmer, Rajasthan. It was historically developed and maintained by Rajput (Kshatriya) communities as a seasonal river or large rain-fed tank. The nadi served as a crucial source of drinking and irrigation water in this arid Thar Desert region.<br/>Built centuries ago using local stone and natural catchment engineering, it reflects the self-sustaining water wisdom of warrior clans who settled in the region.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Farming: Post-monsoon water may still support limited agriculture, especially bajra, guar, and fodder crops.</li><li>Drinking Water: Not in regular use now due to contamination and seasonal drying.</li><li>Grazing & Livestock Use: Some villagers allow animals to drink from the water when present.</li><li>Wastewater Runoff: Sadly, parts of the nadi may now collect village runoff or waste, reducing its traditional utility.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>While not a temple-linked water body, it may have been used for ritual bathing, community prayers for rain, or ancestral worship.</li><li>During traditional festivals or after rainfall, locals may gather to celebrate or offer thanks.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Cultural & Rural Tourism: As part of the Thar heritage landscape, it can attract those interested in traditional water systems.</li><li>Educational Visits: Can be used to educate students and visitors about community-based water conservation.</li><li>Restored Landscape Tourism: With basic restoration and landscaping, it could become a picnic or rural walk site.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Catchment-Based Design: The nadi used natural slope and embankments to collect runoff efficiently.</li><li>Silt Management Potential: Its open design allows manual desilting and reuse.</li><li>Groundwater Recharge: Helped maintain subsurface moisture in surrounding areas during monsoons.</li><li>Built without cement or concrete — fully earthen or stone-lined system, using sustainable techniques.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: Seasonal. In good rainfall years, it stores water for 2–4 months. In dry years, it dries up quickly.</li><li>Water Quality: Poor — algal bloom, cattle dung, possible household wastewater entry.</li><li>Physical Status: Erosion of bunds, silt deposition, and weed overgrowth. Partially visible; some sections may be encroached or used as dumping grounds.</li></ul><br/>Kshatriyoon ki Nadi is a testimony to the desert warriors' resilience. Its revival is not just about water — it's about restoring the pride of a community's heritage.`
                };
                function setTab(tab) {
                    tabContent.innerHTML = tabData[tab];
                    villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                    villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                }
                setTab('overview');
                villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
                    btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                });
            }, 0);
        }
        else if (village.id === 'kelwa') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="kelwa-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
                    <button class="kelwa-main-tab active" data-main-tab="roop">Roop Sagar</button>
                    <button class="kelwa-main-tab" data-main-tab="dholi">Dholi Bawadi</button>
                </div>
                <div class="kelwa-bawadi-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => {
                // Images for Kelwa
                const roopImages = [
                    {src: 'images/kelwa/1.jpg', caption: 'Roop Sagar – Kelwa, Rajasthan'},
                    {src: 'images/kelwa/2.jpg', caption: 'Traditional man-made lake, Kelwa.'},
                    {src: 'images/kelwa/3.jpg', caption: 'Current state of Roop Sagar.', viewAll: true}
                ];
                const dholiImages = [
                    {src: 'images/kelwa/4.jpg', caption: 'Dholi Bawadi – Kelwa, Rajasthan'},
                    {src: 'images/kelwa/5.jpg', caption: 'Traditional stepwell structure, Dholi Bawadi.'},
                    {src: 'images/kelwa/6.jpg', caption: 'Current state of Dholi Bawadi.', viewAll: true}
                ];
                // Tab content for Roop Sagar
                const roopTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Roop Sagar, Kelwa</td></tr>
                            <tr><th>District</th><td>Rajsamand</td></tr>
                            <tr><th>Latitude</th><td>25.150419</td></tr>
                            <tr><th>Longitude</th><td>73.843907</td></tr>
                        </table>
                        Roop Sagar is a historic water reservoir situated near Kelwa in Rajasthan. It was traditionally developed as a man-made lake to support the agrarian and domestic needs of the region.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Roop Sagar is a historic water reservoir situated near Kelwa in Rajasthan. It was traditionally developed as a man-made lake to support the agrarian and domestic needs of the region. Built by local rulers or community efforts centuries ago, it served as a sustainable water storage system, especially important in the arid zone of southern Rajasthan. The name "Roop Sagar" suggests aesthetic as well as practical significance—'Roop' meaning beauty and 'Sagar' meaning sea/lake.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Farming: The water is used for irrigation in nearby agricultural lands.</li><li>Drinking Water: It contributes to the local drinking water supply, although often filtered or supplemented.</li><li>Tourism & Social Gathering: Locals gather during festivals or for leisure activities.</li><li>Aquatic Life: The lake supports fishery in a limited capacity.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Roop Sagar may not be a major pilgrimage site, but many such lakes have small shrines or temples nearby where locals offer prayers or perform rituals during traditional festivals. It likely holds regional religious value during monsoon-based rituals or temple festivals.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Scenic Views: With natural surroundings and a calm water body, it has potential for eco-tourism or nature-based tourism.</li><li>Cultural Experience: Visitors can observe rural Rajasthani lifestyle and traditional water conservation practices.</li><li>Accessibility: Being close to Kelwa, it's reachable by road and offers a serene escape for travelers.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Traditional Rainwater Harvesting: The structure reflects Rajasthan's indigenous knowledge of capturing and storing monsoon water.</li><li>Earth-embankment Techniques: Constructed using local materials, the bund and catchment area design help in percolation and storage.</li><li>Watershed Management: Often integrated with a broader network of ponds and streams.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: The lake is mostly seasonal, filled during the monsoon. Storage depends on rainfall and upstream inflow. It may face drying in peak summer.</li><li>Water Quality: Varies seasonally. During monsoon, it is relatively fresh, but post-monsoon and summer may show signs of algae growth, pollution, or turbidity. Basic quality remains usable for irrigation and limited domestic use.</li></ul>`
                };
                // Tab content for Dholi Bawadi
                const dholiTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Dholi Bawadi, Kelwa</td></tr>
                            <tr><th>District</th><td>Rajsamand</td></tr>
                            <tr><th>Latitude</th><td>25.150419</td></tr>
                            <tr><th>Longitude</th><td>73.843907</td></tr>
                        </table>
                        Dholi Bawadi is a traditional stepwell (bawadi) located in Kelwa, Rajasthan. The word "Dholi" suggests a reference to "white" or something associated with purity, possibly related to the stone used or the water clarity in earlier times.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Dholi Bawadi is a traditional stepwell (bawadi) located in Kelwa, Rajasthan. The word "Dholi" suggests a reference to "white" or something associated with purity, possibly related to the stone used or the water clarity in earlier times. Built centuries ago, likely during the rule of Rajput clans or local rulers, Dholi Bawadi was an essential part of the region's water architecture. It served as a dependable water source in the arid climate of Rajasthan and was a crucial spot for daily life and gatherings.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Drinking Water: It may have been a drinking water source earlier, but its usage has now diminished or shifted to symbolic/traditional use.</li><li>Social Gathering: In many rural and semi-urban areas, bawadis served as social hubs where women gathered water and interacted.</li><li>Tourism/Education: Occasionally visited for its architectural value or traditional design.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Stepwells like Dholi Bawadi are often situated near temples or shrines. They may host local religious ceremonies, especially during monsoons or specific Hindu festivals like Gangaur or Navratri, and are sometimes regarded as sacred spaces due to their life-sustaining water source.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Architectural Heritage: Dholi Bawadi showcases traditional Rajasthani stepwell design—intricate stonework, multi-level steps, and water management features.</li><li>Cultural Importance: Can attract visitors interested in Rajasthan's water heritage and ancient engineering.</li><li>Photographic Interest: The symmetry and historical aesthetics make it appealing for heritage photographers.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Stepwell Engineering: Built with descending steps to access water at various levels depending on water availability.</li><li>Passive Cooling: These structures often remain cooler inside, functioning like natural air-conditioning in the desert climate.</li><li>Groundwater Recharge: It likely served both as a source and recharge system for groundwater.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water Quantity: In modern times, Dholi Bawadi may no longer hold significant water year-round. It possibly fills during monsoon but dries up later.</li><li>Water Quality: Likely unfit for drinking currently due to stagnation, pollution, or sediment accumulation unless it has been restored.</li><li>Restoration Status: If not maintained, it may face issues like siltation, encroachment, or structural degradation</li></ul>`
                };
                // Render main tab content
                function renderBawadiTab(mainTab) {
                    const contentDiv = villageInfo.querySelector('.kelwa-bawadi-content');
                    // Images and sub-tabs
                    const imgs = mainTab === 'roop' ? roopImages : dholiImages;
                    const tabData = mainTab === 'roop' ? roopTabData : dholiTabData;
                    contentDiv.innerHTML = `
                        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                            <div class="ratangarh-image-row" style="height:100%;"></div>
                            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                        </div>
                        <div class="ratangarh-tabs">
                            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
                            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
                        </div>
                        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                    `;
                    // Insert images
                    const imageRow = contentDiv.querySelector('.ratangarh-image-row');
                    imgs.forEach((img, i) => {
                        const box = document.createElement('div');
                        box.className = 'ratangarh-img-box';
                        box.innerHTML = `<img src='${img.src}' alt='Kelwa Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                        if (img.viewAll) {
                            const btn = document.createElement('a');
                            btn.href = 'kelwa.html';
                            btn.className = 'view-all-photos-btn';
                            btn.textContent = 'View All Photos';
                            box.appendChild(btn);
                        }
                        imageRow.appendChild(box);
                    });
                    // Arrow logic
                    let currentIndex = 0;
                    const leftArrow = contentDiv.querySelector('.ratangarh-arrow-left');
                    const rightArrow = contentDiv.querySelector('.ratangarh-arrow-right');
                    function updateArrows() {
                        leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                        rightArrow.style.display = currentIndex < imgs.length-1 ? 'flex' : 'none';
                    }
                    function scrollToIndex(idx) {
                        const box = imageRow.children[idx];
                        if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
                        currentIndex = idx;
                        updateArrows();
                    }
                    leftArrow.onclick = () => scrollToIndex(currentIndex-1);
                    rightArrow.onclick = () => scrollToIndex(currentIndex+1);
                    imageRow.addEventListener('scroll', () => {
                        let minDist = Infinity, idx = 0;
                        for (let i=0; i<imageRow.children.length; ++i) {
                            const rect = imageRow.children[i].getBoundingClientRect();
                            const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                            if (dist < minDist) { minDist = dist; idx = i; }
                        }
                        currentIndex = idx;
                        updateArrows();
                    });
                    // Initial state
                    scrollToIndex(0);
                    // Sub-tabs logic
                    const tabContent = contentDiv.querySelector('#ratangarh-tab-content');
                    function setTab(tab) {
                        tabContent.innerHTML = tabData[tab];
                        contentDiv.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                        contentDiv.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                    }
                    setTab('overview');
                    contentDiv.querySelectorAll('.ratangarh-tab').forEach(btn => {
                        btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                    });
                }
                // Main tab logic
                let currentMainTab = 'roop';
                renderBawadiTab(currentMainTab);
                villageInfo.querySelectorAll('.kelwa-main-tab').forEach(btn => {
                    btn.onclick = () => {
                        villageInfo.querySelectorAll('.kelwa-main-tab').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentMainTab = btn.getAttribute('data-main-tab');
                        renderBawadiTab(currentMainTab);
                    };
                });
            }, 0);
        }
        // ... existing code ...
else if (village.id === 'rajasmand_village') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/rajsamand/1.jpg', caption: 'Aerial view of Rajsamand Lake'},
            {src: 'images/rajsamand/2.jpg', caption: 'Raj Prashasti inscription on marble embankment'},
            {src: 'images/rajsamand/3.jpg', caption: 'Boating at Rajsamand Lake', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Rajsamand Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'rajsamand.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Rajsamand Lake, Rajsamand</td></tr>
                    <tr><th>District</th><td>Rajsamand</td></tr>
                    <tr><th>Latitude</th><td>25.0736</td></tr>
                    <tr><th>Longitude</th><td>73.8798</td></tr>
                </table>
                Rajsamand Lake is a vast artificial lake built in the 17th century, renowned for its historical, cultural, and ecological significance in Rajasthan. It serves as a vital water source and a major tourist attraction, surrounded by scenic hills and marble embankments.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                <ul>
                    <li>Rajsamand Lake is one of the largest artificial lakes in Rajasthan, built in 1662 AD by Maharana Raj Singh I of Mewar. The lake was constructed across the Gomati, Kelwa, and Tali rivers to combat droughts and provide water for agriculture, drinking, and daily use in the Mewar region.</li>
                    <li>An important historical feature is the Raj Prashasti, the longest stone inscription in India, engraved on marble slabs along the dam embankment. It records the history and achievements of Mewar rulers and reflects the cultural richness of the era.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Drinking Water:</b> The lake continues to supply potable water to nearby towns and villages.</li>
                    <li><b>Irrigation:</b> It supports farming and agriculture by providing irrigation water.</li>
                    <li><b>Tourism & Recreation:</b> Locals and tourists visit for boating, picnics, and leisure walks.</li>
                    <li><b>Fisheries:</b> Fishing is practiced in a regulated manner, supporting local livelihoods.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Rajsamand Lake is considered spiritually important, especially during festivals like Gangaur and Kartik Purnima.</li>
                    <li>The lakefront has temples and ghats (bathing steps), where rituals, aartis, and religious processions take place.</li>
                    <li>Many locals perform ancestral rituals and holy dips here.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li><b>Scenic Spot:</b> Surrounded by hills and palaces, it's a tranquil escape for tourists and nature lovers.</li>
                    <li><b>Historical Attraction:</b> Visitors come to see Raj Prashasti, the dam (Nauchowki), and the marble embankments.</li>
                    <li><b>Cultural Tourism:</b> Festivals and fairs at the lake draw large crowds.</li>
                    <li><b>Photography & Boating:</b> A popular spot for sunset photography, birdwatching, and boat rides.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty (Design, Construction, etc.)</b>
                <ul>
                    <li><b>Massive Embankment:</b> Built using white marble, the lake is bordered by nine pavilions (nauchowki) with beautiful carvings.</li>
                    <li><b>Hydraulic Engineering:</b> Diverts and stores river water, prevents flood damage, and maintains groundwater levels.</li>
                    <li><b>Early Water Management:</b> Represents 17th-century water sustainability efforts, showing foresight in managing water in arid zones.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition (Water Quantity & Quality)</b>
                <ul>
                    <li><b>Water Quantity:</b> Well-maintained with a large storage capacity. The lake fills up during monsoons and sustains year-round.</li>
                    <li><b>Water Quality:</b> Generally good, but prone to pollution from urban runoff or human activity during festivals.</li>
                    <li><b>Conservation Efforts:</b> Ongoing government and community efforts aim to clean, preserve, and beautify the lake for tourism and heritage protection.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    
        // ... existing code ...
    // ... existing code ...
else if (village.id === 'dadrewa') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/dadrewa/1.jpg', caption: 'View of Daab, Dadrewa'},
            {src: 'images/dadrewa/2.jpg', caption: 'Gorkh Ganga Daab during monsoon'},
            {src: 'images/dadrewa/3.jpg', caption: 'Community gathering at Daab', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Dadrewa Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'dadrewa.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Daab, Dadrewa Village</td></tr>
                    <tr><th>District</th><td>Nagaur</td></tr>
                    <tr><th>Latitude</th><td>27.2092</td></tr>
                    <tr><th>Longitude</th><td>74.5436</td></tr>
                </table>
                Daab in Dadrewa is a traditional water conservation structure in Rajasthan's arid Marwar region. Known as "Gorkh Ganga Daab," it holds spiritual and practical significance for the local community, serving as a seasonal water source and a site for rituals and gatherings.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                <ul>
                    <li>Daab is a traditional water source located in Dadrewa village, Rajasthan, in the Nagaur district, part of the arid Marwar region. The term "Daab" refers to a natural or man-made depression used to collect rainwater. "Gorkh Ganga" suggests a spiritual or sacred significance, possibly linked to Gorkhnath, a revered saint in Nath tradition, and Ganga, the holy river, symbolizing purity.</li>
                    <li>Historically, this daab was constructed or maintained by local yogis or saints and the rural community to serve as a water conservation structure in the desert landscape. It provided water during extreme drought conditions and played a central role in the village's survival.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Drinking & Utility Water:</b> Not used by locals for drinking, but for bathing and livestock, especially in dry seasons.</li>
                    <li><b>Community Gathering Place:</b> Functions as a spiritual water body.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Considered sacred by villagers, often linked to Gorakhnath traditions.</li>
                    <li>Water from Gorkh Ganga Daab is believed to have spiritual purity and is used during local rituals and ceremonies.</li>
                    <li>People offer prayers or perform ablutions before temple visits, especially during festivals like Shivratri or local melas.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li><b>Spiritual Tourism:</b> Can attract visitors interested in Nath traditions or rural spiritual heritage.</li>
                    <li><b>Eco-Tourism & Cultural Experience:</b> Visitors can witness traditional Marwari water conservation and village lifestyle.</li>
                    <li><b>Local Folklore:</b> Adds appeal through stories associated with saints and seasonal rituals.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty (Design, Construction, etc.)</b>
                <ul>
                    <li><b>Daab Structure:</b> A simple but highly effective rainwater harvesting depression, dug in a catchment zone to store monsoon water.</li>
                    <li><b>Groundwater Recharge:</b> Helps replenish underground aquifers, benefiting nearby wells and hand pumps.</li>
                    <li><b>Low-Cost Traditional Engineering:</b> Built with earth and stone bunds, relying on gravity and natural slope to collect runoff.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition (Water Quantity & Quality)</b>
                <ul>
                    <li><b>Water Quantity:</b> Highly seasonal — fills during monsoon and retains water well into the dry season if maintained.</li>
                    <li><b>Water Quality:</b> Generally fair due to low pollution, but needs occasional cleaning of silt and vegetation.</li>
                    <li><b>Maintenance Status:</b> If locally maintained (often by temple trusts or community), it remains functional; otherwise, it may face encroachment or silting.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    

// ... existing code ...
// ... existing code ...
else if (village.id === 'rajnagar') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/rajnagar/1.jpg', caption: 'Ood Bawadi Stepwell, Rajnagar'},
            {src: 'images/rajnagar/2.jpg', caption: 'Intricate stonework of Ood Bawadi'},
            {src: 'images/rajnagar/3.jpg', caption: 'Community event at Ood Bawadi', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Rajnagar Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'rajnagar.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Ood Bawadi, Rajnagar</td></tr>
                    <tr><th>District</th><td>Rajsamand</td></tr>
                    <tr><th>Latitude</th><td>25.0800</td></tr>
                    <tr><th>Longitude</th><td>73.9000</td></tr>
                </table>
                Ood Bawadi is a historic stepwell in Rajnagar, near Rajsamand, Rajasthan. Built during the Mewar era, it exemplifies the region's traditional water conservation and architectural heritage, serving both practical and cultural roles in the community.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                <ul>
                    <li>Ood Bawadi is a historic stepwell (bawadi) located in Rajnagar, near Rajsamand in Rajasthan. It was built during the Mewar era, likely in the 18th or 19th century, as part of a broader network of water structures developed by local rulers to combat water scarcity in the region.</li>
                    <li>The term "Ood" possibly refers to a specific locality, land donor, or community. Stepwells like this played a crucial role in the socio-hydrological systems of arid Rajasthan, acting as sustainable water harvesting and storage structures.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Water Conservation:</b> Still serves to recharge groundwater during the monsoon.</li>
                    <li><b>Cultural Gatherings:</b> Occasionally used for local community events or school visits.</li>
                    <li><b>Drinking/Utility Use:</b> Earlier it was a key source of drinking water, but now is used more symbolically or for livestock or non-potable needs.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Many bawadis in Rajasthan are considered sacred spaces, with small shrines or temples nearby.</li>
                    <li>Ood Bawadi is likely associated with seasonal religious rituals, such as offerings during the rainy season or during traditional water festivals.</li>
                    <li>Locals may still visit it during religious processions or for spiritual purification.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li><b>Architectural Value:</b> Ood Bawadi features intricately carved steps, stone pillars, and a symmetrical design, which appeals to heritage enthusiasts.</li>
                    <li><b>Cultural Tourism:</b> Ideal for those exploring the Rajsamand lake, Kumbhalgarh Fort, and nearby Udaipur—this stepwell adds depth to the region's heritage circuit.</li>
                    <li><b>Eco-Tourism:</b> Its historical water conservation methods could attract researchers and environmental tourists.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty (Design, Construction, etc.)</b>
                <ul>
                    <li><b>Stepwell Design:</b> Ood Bawadi uses a deep multi-tiered structure to tap into groundwater and store rainwater. It enables access to water at different depths throughout the year.</li>
                    <li><b>Thermal Regulation:</b> Like many stepwells, it offers cooler temperatures inside, making it a practical and climate-resilient structure.</li>
                    <li><b>Rainwater Harvesting:</b> Designed to trap surface runoff and filter it into deeper aquifers.</li>
                    <li><b>Sustainable Engineering:</b> Built without modern materials, relying on local stone, gravity flow, and manual labor.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition (Water Quantity & Quality)</b>
                <ul>
                    <li><b>Water Quantity:</b> Partially functional—fills during monsoons but may remain dry during summers. The exact level depends on rainfall and maintenance of the catchment area.</li>
                    <li><b>Water Quality:</b> Often poor due to sedimentation, waste, or lack of regular cleaning. Restoration efforts (if any) could improve this.</li>
                    <li><b>Preservation Needs:</b> Like many heritage water structures, Ood Bawadi requires cleaning, desilting, and awareness campaigns to ensure its continued use and conservation.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...
// ... existing code ...
else if (village.id === 'amet') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/amet/1.jpg', caption: 'Rajon Ki Bawadi, Amet'},
            {src: 'images/amet/2.jpg', caption: 'Stone masonry and steps of Rajon Ki Bawadi'},
            {src: 'images/amet/3.jpg', caption: 'Heritage architecture of the stepwell', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Amet Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'amet.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Rajon Ki Bawadi, Amet</td></tr>
                    <tr><th>District</th><td>Rajsamand</td></tr>
                    <tr><th>Latitude</th><td>25.0500</td></tr>
                    <tr><th>Longitude</th><td>73.8500</td></tr>
                </table>
                Rajon Ki Bawadi is a historic stepwell in Amet, Rajsamand district, Rajasthan. Built during the Rajput rule, it represents traditional Mewar-style architecture and water management systems, serving as both a practical water source and a cultural heritage site.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                <ul>
                    <li>Rajon Ki Bawadi is a historic stepwell located in Amet, Rajsamand district, Rajasthan. The name "Rajon" refers to the Raj Mistris (royal masons) or elite classes who either constructed or primarily used the stepwell.</li>
                    <li>It is believed to have been built several centuries ago during the Rajput rule, possibly in the 17th–18th century, as a part of the traditional water management systems that helped the region survive long dry spells.</li>
                    <li>This bawadi was not just a water source but also a symbol of architectural skill, indicating the wealth and aesthetic sense of the era. It represents a typical Mewar-style stepwell, with deep stone masonry and symmetrical steps leading down to the water.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Seasonal Water Storage:</b> It continues to hold water during monsoons, aiding groundwater recharge.</li>
                    <li><b>Livelihood Use:</b> Local people may still use it for washing clothes, livestock, or non-potable water needs.</li>
                    <li><b>Cultural Symbol:</b> Serves as a heritage point for the community and local gatherings.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Rajon Ki Bawadi, like many traditional stepwells, has a spiritual role in the community.</li>
                    <li>Likely used for ritual bathing during religious festivals.</li>
                    <li>Nearby shrines or idols may exist on the steps or walls.</li>
                    <li>Considered auspicious during Gangaur, Navratri, or other regional fairs.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li><b>Heritage Attraction:</b> Its stone carvings, layered step design, and architectural proportions make it a potential heritage tourism spot.</li>
                    <li><b>Educational Value:</b> Ideal for students of architecture, water management, or cultural studies.</li>
                    <li><b>Photography Spot:</b> Offers stunning visuals due to geometric design and historic ambiance.</li>
                    <li><b>Eco-Tourism Add-on:</b> Can be included in regional heritage circuits with Rajsamand Lake, Kumbhalgarh, and Amet temples.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty (Design, Construction, etc.)</b>
                <ul>
                    <li><b>Stepwell Design:</b> Deep vertical structure with multiple tiers of steps that allow access to water at various levels.</li>
                    <li><b>Thermal Comfort:</b> Interior stays cooler than surroundings, offering a resting place during peak summers.</li>
                    <li><b>Rainwater Harvesting:</b> Channels surface runoff into the stepwell, storing and replenishing subsurface aquifers.</li>
                    <li><b>Stone Architecture:</b> Built using local sandstone, it showcases the skill of Rajput-era masons.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition (Water Quantity & Quality)</b>
                <ul>
                    <li><b>Water Quantity:</b> Holds water primarily during monsoon season. May remain partially filled during other months depending on rainfall.</li>
                    <li><b>Water Quality:</b> Not suitable for drinking now due to silt, debris, or stagnation, but usable for secondary purposes.</li>
                    <li><b>Restoration Needs:</b> It may require cleaning, structural repair, and signage to preserve its heritage value and attract visitors.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    
else if (village.id === 'sardar_samand') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/sardar_samand/1.jpg', caption: 'Sardar Samand Lake - panoramic view'},
            {src: 'images/sardar_samand/2.jpg', caption: 'Dimdi Well - traditional water source'},
            {src: 'images/sardar_samand/3.jpg', caption: 'Historic Nadi with Chakki', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Sardar Samand Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'sardar_samand.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Sardar Samand, Pali District</td></tr>
                    <tr><th>Latitude</th><td>25.8000</td></tr>
                    <tr><th>Longitude</th><td>73.2000</td></tr>
                </table>
                Sardar Samand is a historic artificial lake and water system in Rajasthan, built in the early 20th century. It includes the main lake, traditional wells, and unique waterbodies like the Nadi with Chakki, reflecting the region's ingenuity in water management and rural life.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li><b>Sardar Samand Lake:</b> Built in 1902 by Maharaja Umaid Singh, this artificial lake was developed to serve as a major water reservoir for nearby villages.</li>
                    <li><b>Dimdi (Well):</b> Constructed by Jabbar Singh, this traditional well historically supplied water for agriculture through underground sources and a connected lake.</li>
                    <li><b>Pili Nadi:</b> A once-essential community river used for drinking and household purposes.</li>
                    <li><b>100+ Year Old Nadi with Chakki:</b> Built by Kishore Singh, this unique traditional waterbody integrated a bull-powered grinding wheel (chakki) that not only drew water but also ground wheat—demonstrating self-sustained rural life and local ingenuity.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Sardar Samand Lake:</b> Still provides water to nearby villages and supports wildlife, although it's now under stress from overuse.</li>
                    <li><b>Dimdi:</b> Continues to be used for irrigation, but its quality has severely deteriorated.</li>
                    <li><b>Pili Nadi:</b> No longer used for daily needs due to the shift to piped water systems but remains a water source for cattle.</li>
                    <li><b>Nadi with Chakki:</b> No longer in functional use, though it stands as a monument to past practices.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                While direct religious rituals are not explicitly mentioned, the continued cultural reverence and community memory attached to the Nadi, Dimdi, and Pili Nadi reflect a spiritual connection to these water sources, often seen in traditional rural Rajasthan where water bodies are considered sacred lifelines.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Sardar Samand Lake offers significant tourism potential due to its scenic beauty, historic origins, and local wildlife presence.</li>
                    <li>The century-old Nadi with Chakki has heritage value, making it ideal for rural tourism or eco-tourism models showcasing traditional water management and food systems.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li><b>Dimdi:</b> Represents a hybrid water source drawing from both underground aquifers and lake water—valuable for hydrological study.</li>
                    <li><b>Nadi with Chakki:</b> A mechanical innovation where a single energy source powered both water lifting and grain grinding—highlighting traditional knowledge in sustainable tech.</li>
                    <li>Water samples collected by Team RetroFlow for quality testing represent modern scientific engagement with legacy systems.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li><b>Sardar Samand Lake:</b> Suffering from pollution and overuse.</li>
                    <li><b>Dimdi:</b> Water quality declined significantly due to pollution.</li>
                    <li><b>Pili Nadi:</b> Largely unused, but still relevant for cattle and ecosystem.</li>
                    <li><b>Nadi with Chakki:</b> Forgotten and non-functional, but structurally present.</li>
                </ul>
                <b>Community Awareness & Initiatives:</b><br/>
                Aditya Gautam and Team RetroFlow (JCKIC) are actively working with local panchayats on:
                <ul>
                    <li>Water sample analysis</li>
                    <li>Preservation of traditional systems</li>
                    <li>Proposing rainwater harvesting systems</li>
                    <li>Raising awareness about water salinity and sustainable practices</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    


// ... existing code ...    
else if (village.id === 'khejarala') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/khejarala/1.jpg', caption: 'Sujaan Sagar Talab - community waterbody'},
            {src: 'images/khejarala/2.jpg', caption: 'Jinn Ka Bera - legendary well'},
            {src: 'images/khejarala/3.jpg', caption: 'Traditional Tanka and Nadi', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Khejarala Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'khejarala.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Khejarala, Pali District</td></tr>
                    <tr><th>Latitude</th><td>25.7000</td></tr>
                    <tr><th>Longitude</th><td>73.9500</td></tr>
                </table>
                Khejarala is renowned for its traditional water heritage, including Sujaan Sagar Talab, Jinn Ka Bera, tankas, and nadis. These structures reflect the village's sustainable water management and deep-rooted cultural traditions in arid Rajasthan.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li><b>Sujaan Sagar Talab:</b> An ancient talab, deeply rooted in community tradition, has long served as a key source for drinking, irrigation, and livestock needs. It's a testament to Rajasthan's legacy of sustainable water conservation in arid landscapes.</li>
                    <li><b>Jinn Ka Bera (Well):</b> A 100–200-year-old well, steeped in local mythology, believed to have been built overnight by a jinn. This traditional beri (well) represents both historical value and cultural imagination.</li>
                    <li><b>Tanka (Cylindrical & School-based):</b> Traditional rainwater harvesting structures, circular or square, made of lime, cement, or stone. These have been used for generations across Rajasthan and now reintroduced in government schools for daily use.</li>
                    <li><b>Nadi (Rainwater Depression):</b> Shallow, earthen community depressions 20–25 feet deep, long used during the monsoon to support village ecosystems. Historically located on village outskirts.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li><b>Tanka (Govt. School):</b> Still in daily use for drinking and hygiene needs in a primary government school. A great example of continued relevance of traditional water harvesting.</li>
                    <li><b>Sujaan Sagar Talab:</b> Actively used by locals and outsiders for drinking, irrigation, and livestock, especially during the rainy season when it fills completely.</li>
                    <li><b>Government Handpump:</b> Still widely used for drinking water, but with concerns due to high fluoride and salinity.</li>
                    <li><b>Canal:</b> Used for irrigation, helping to sustain crop cycles during dry seasons, while also recharging groundwater.</li>
                    <li><b>Nadi:</b> Primarily active during the rainy season, used for drinking, livestock, and irrigation when filled.</li>
                    <li><b>Jinn Ka Bera (Well):</b> Serves multiple purposes—drinking, irrigation, livestock—even today.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li><b>Jinn Ka Bera:</b> Holds mythological significance, believed to be built by a jinn overnight, which enhances its spiritual aura among locals.</li>
                    <li><b>Sujaan Sagar Talab & Nadis:</b> While not explicitly used for rituals, these are culturally sacred as community lifelines, often accompanied by local faith in their power to provide.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li><b>Jinn Ka Bera:</b> The folklore around its creation gives it high potential for heritage tourism. It could attract cultural explorers interested in local legends and rural architecture.</li>
                    <li><b>Sujaan Sagar Talab:</b> Due to its scenic full-water state during monsoon, this site can be developed for eco-tourism and heritage trails.</li>
                    <li><b>Traditional Tankas & Nadis:</b> Could be featured in rural tourism circuits demonstrating ancient water sustainability practices of Rajasthan.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li><b>Tanka Structure:</b> A low-tech, high-efficiency solution for arid regions—circular/square, lime/cement-plastered, preventing seepage and ensuring safe water storage.</li>
                    <li><b>Fluoride Contamination (Handpump):</b> The presence of fluoride and salinity at 250–300 feet is a key issue. It serves as a case study in rural water safety and public health challenges.</li>
                    <li><b>Canal System:</b> Highlights modern interventions that support groundwater recharge, improve crop reliability, and complement traditional systems.</li>
                    <li><b>Nadis:</b> Naturally recharge groundwater and support local ecology, acting as an eco-hydrological buffer during monsoon.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li><b>Sujaan Sagar Talab:</b> Well-maintained and fully utilized during rains, but its long-term sustainability depends on regular desilting and protection from encroachment.</li>
                    <li><b>Tanka (School-based):</b> Functional and beneficial, showing how traditional designs can meet modern needs.</li>
                    <li><b>Jinn Ka Bera:</b> Structurally intact but under-documented; local myths may overshadow preservation efforts.</li>
                    <li><b>Government Handpump:</b> Functional but problematic due to unsafe fluoride levels, causing tooth decay and bone weakening—urgent attention needed.</li>
                    <li><b>Nadi:</b> Still in seasonal use but may require regular cleaning, deepening, and community management.</li>
                </ul>
                <b>Revival Initiatives:</b><br/>
                Led by Shree Rajendra Bhakar with NGOs and personal efforts.<br/>
                Supported by Team RetroFlow, which is engaging local leaders like Shree Muldan Chaaran for field visits, awareness, and sustainable water system advocacy.
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    

else if (village.id === 'siyai') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/siyai/1.jpg', caption: 'Traditional Tanka in Siyai'},
            {src: 'images/siyai/2.jpg', caption: 'Rainwater harvesting system'},
            {src: 'images/siyai/3.jpg', caption: 'Desert water conservation', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Siyai Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'siyai.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Siyai, Barmer District</td></tr>
                    <tr><th>Latitude</th><td>25.7500</td></tr>
                    <tr><th>Longitude</th><td>71.4000</td></tr>
                </table>
                Siyai is known for its traditional Tanka system, a centuries-old rainwater harvesting method that continues to provide vital water resources in this arid desert region of Rajasthan.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>The Tanka is a traditional rainwater harvesting structure used for centuries across Rajasthan, especially in desert regions like Siyai.</li>
                    <li>Typically built underground and covered, it collects rainwater from rooftops or open courtyards.</li>
                    <li>It reflects the age-old wisdom of water conservation in one of India's most water-scarce regions.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>In Siyai, Tankas are still actively used for drinking water and household purposes (cooking, cleaning, washing).</li>
                    <li>These are especially vital during dry months, providing safe and clean water in the absence of surface sources.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>While not associated with formal religious rituals, Tankas are culturally respected as lifelines of desert households.</li>
                    <li>Their upkeep is often seen as a moral and social responsibility, and in some communities, clean water from the Tanka may be used in domestic religious ceremonies or offerings.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Though Tankas are primarily domestic structures, they offer educational value for eco-tourists, researchers, and students of sustainable living.</li>
                    <li>A rural tourism trail showcasing traditional desert water management (like Tanka, Nadi, Talab) could make Siyai a part of a broader eco-cultural experience in Barmer and Jodhpur regions.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The Tanka system is a low-cost, decentralized water solution, ideal for arid ecosystems.</li>
                    <li>Scientifically significant for minimizing evaporation, maximizing runoff capture, and improving water self-reliance.</li>
                    <li>Their continued use offers valuable insights for modern sustainable urban planning and water resilience models.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Tankas in Siyai are functional and widely used, especially in homes without access to regular piped water.</li>
                    <li>They are generally well-maintained, as they are crucial to daily life in this arid region.</li>
                    <li>With growing awareness, these structures continue to serve as an example of effective traditional water management in modern times.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    
else if (village.id === 'ramsar') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;"></div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Insert images into the image row
        const images = [
            {src: 'images/ramsar/1.jpg', caption: 'Uttam Singh Model Pond'},
            {src: 'images/ramsar/2.jpg', caption: 'Traditional Talab and Wells'},
            {src: 'images/ramsar/3.jpg', caption: 'Community water heritage', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Ramsar Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'ramsar.html';
                btn.className = 'view-all-photos-btn';
                btn.textContent = 'View All Photos';
                box.appendChild(btn);
            }
            imageRow.appendChild(box);
        });
        // Arrow logic
        let currentIndex = 0;
        const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
        const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
        function updateArrows() {
            leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
            rightArrow.style.display = currentIndex < images.length-1 ? 'flex' : 'none';
        }
        function scrollToIndex(idx) {
            const box = imageRow.children[idx];
            if (box) box.scrollIntoView({behavior:'smooth',inline:'start'});
            currentIndex = idx;
            updateArrows();
        }
        leftArrow.onclick = () => scrollToIndex(currentIndex-1);
        rightArrow.onclick = () => scrollToIndex(currentIndex+1);
        imageRow.addEventListener('scroll', () => {
            let minDist = Infinity, idx = 0;
            for (let i=0; i<imageRow.children.length; ++i) {
                const rect = imageRow.children[i].getBoundingClientRect();
                const dist = Math.abs(rect.left - imageRow.getBoundingClientRect().left);
                if (dist < minDist) { minDist = dist; idx = i; }
            }
            currentIndex = idx;
            updateArrows();
        });
        // Initial state
        scrollToIndex(0);
        // Tabs logic
        const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
        const tabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Ramsar, Barmer District</td></tr>
                    <tr><th>Latitude</th><td>25.8500</td></tr>
                    <tr><th>Longitude</th><td>71.5000</td></tr>
                </table>
                Ramsar is home to diverse traditional water systems including the renovated Uttam Singh Model Pond, traditional Talabs, Wells, and Tankas. These structures represent a successful model of community-led water conservation in Rajasthan's arid landscape.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li><b>Uttam Singh Model Pond (Talab):</b> Renovated during 2020–21 with the support of Marico Limited, Zila Parishad Barmer, Panchayat Samiti Ramsar, Gram Panchayat Ramsar, and Dhara Sansthan Barmer. Originally built as a traditional rainwater pond, the renovation aimed to revive its heritage role in water storage and management.</li>
                    <li><b>Talab:</b> A centuries-old system in Rajasthan for rainwater harvesting, traditionally constructed to serve community needs. Often accompanied by ghats, Talabs are architectural and cultural icons in desert landscapes.</li>
                    <li><b>Wells (Kuan/Beri):</b> Ancient groundwater access systems, ranging from 20 to 100 meters in depth, lined with stone or mortar, historically used for drinking, irrigation, and livestock.</li>
                    <li><b>Tanka:</b> Traditional domestic rainwater harvesting tanks, used for centuries across Rajasthan, especially in homes and schools, highlighting self-reliant water practices.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Uttam Singh Model Pond now stores rainwater, supporting drinking, irrigation, and livestock, particularly during dry seasons.</li>
                    <li>Wells remain in use for drawing groundwater, especially where piped supply is absent.</li>
                    <li>Tankas continue to serve households, collecting rooftop rainwater for drinking and daily chores.</li>
                    <li>Collectively, these systems still meet basic water needs in an arid region with limited rainfall.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>While no specific rituals are described, Talabs and Wells in Rajasthan traditionally hold cultural and spiritual value.</li>
                    <li>Ghats around Talabs are often used during festivals, ritual baths, and village ceremonies.</li>
                    <li>Water from wells and tankas is typically used in domestic religious functions, like pujas and offerings.</li>
                    <li>The act of maintaining water bodies is itself considered a moral duty in many local traditions.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Uttam Singh Model Pond, if further beautified with ghats, signage, or eco-tourism initiatives, can serve as a case study in successful rural water restoration.</li>
                    <li>Traditional Talabs and stepwells (baoris) can attract tourists interested in desert architecture, hydraulic engineering, and rural sustainability.</li>
                    <li>Promotion as part of a Rajasthan water heritage trail could integrate Ramsar into a larger tourism circuit.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The renovated pond represents a model for community-led, public-private water rejuvenation, integrating traditional systems with modern rainwater storage goals.</li>
                    <li>Wells demonstrate adaptive hydrological engineering through deep excavation and pressure distribution via circular design.</li>
                    <li>Tankas are examples of climate-adaptive, decentralized solutions—simple, yet effective for year-round water security.</li>
                    <li>The Ramsar example offers insight into cost-effective, grassroots water sustainability practices in arid ecosystems.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Uttam Singh Model Pond is functioning and active post-renovation, fulfilling its goal of rainwater conservation.</li>
                    <li>Tankas and Wells continue to function in homes and villages, although maintenance levels may vary.</li>
                    <li>The area's water infrastructure reflects a strong revival movement, supported by community partnerships and NGO collaboration, especially since 2020.</li>
                    <li>These systems highlight a balanced mix of traditional knowledge and modern sustainability efforts, setting a model for other desert regions.</li>
                </ul>
            `
        };
        function setTab(tab) {
            tabContent.innerHTML = tabData[tab];
            villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
            villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
        }
        setTab('overview');
        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
            btn.onclick = () => setTab(btn.getAttribute('data-tab'));
        });
    }, 0);
}
// ... existing code ...    


else {
            // Default for other villages
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="village-image">
                    <img src="${village.image}" alt="${village.name}" onerror="this.style.display='none'">
                </div>
                <div class="village-description">
                    <p>${village.description}</p>
                </div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
        }
        const infoHeader = this.infoPanel.querySelector('.info-header');
        infoHeader.insertAdjacentElement('afterend', villageInfo);
        this.infoPanel.style.display = 'block';
    }

    createVillagePopup(village) {
        return `
            <div class="village-popup-content">
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="village-image">
                    <img src="${village.image}" alt="${village.name}" onerror="this.style.display='none'">
                </div>
                <div class="village-description">
                    <p>${village.description}</p>
                </div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.leaflet-popup').remove()">Close</button>
                </div>
            </div>
        `;
    }

    clearVillageMarkers() {
        // Animate out if needed
        if (this.villageMarkers.length && this.currentDistrict) {
            this.isClearingVillages = true;
            this.animateVillagesToCentroidAndRemove(() => {
                // Failsafe: remove any remaining markers and clear array
                this.villageMarkers.forEach(marker => {
                    if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
                });
                this.villageMarkers = [];
                this.isClearingVillages = false;
            });
        } else {
            this.villageMarkers.forEach(marker => {
                if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
            });
            this.villageMarkers = [];
            this.isClearingVillages = false;
        }
    }

    updateInfoPanel(district) {
        const districtInfo = this.infoPanel.querySelector('.district-info');
        const districtName = this.infoPanel.querySelector('.district-name');
        const districtDescription = this.infoPanel.querySelector('.district-description');
        const villageList = this.infoPanel.querySelector('.village-list');

        districtName.textContent = district.name;
        districtDescription.textContent = `Explore ${district.villages.length} villages in ${district.name} district where our student teams have conducted water conservation studies.`;
        
        // Create village list
        villageList.innerHTML = district.villages.map(village => `
            <div class="village-item" onclick="mapInstance.onVillageClick(${JSON.stringify(village).replace(/"/g, '&quot;')})">
                <div class="village-item-image">
                    <img src="${village.image}" alt="${village.name}" onerror="this.style.display='none'">
                </div>
                <div class="village-item-info">
                    <h5>${village.name}</h5>
                    <p>${village.description.substring(0, 100)}...</p>
                </div>
            </div>
        `).join('');

        districtInfo.style.display = 'block';
        this.infoPanel.style.display = 'block';
    }

    addZoomControl() {
        // Add custom zoom control
        const zoomControl = L.control.zoom({
            position: 'topleft',
            zoomInTitle: 'Zoom in',
            zoomOutTitle: 'Zoom out'
        });
        
        zoomControl.addTo(this.map);
    }

    // Hide villages and info panel when zoomed out
    onZoomChange() {
        if (this.map.getZoom() < this.zoomThreshold) {
            this.clearVillageMarkers();
            this.currentDistrict = null;
            this.infoPanel.style.display = 'none';
            // Restore district markers
            if (this.districtMarkers.length > 0) {
                this.districtMarkers.forEach(marker => marker.addTo(this.map));
            }
            // Remove polygon if present
            if (this.districtPolygon) {
                this.map.removeLayer(this.districtPolygon);
                this.districtPolygon = null;
            }
        } else if (this.currentDistrict && this.villageMarkers.length === 0) {
            this.addVillageMarkers(this.currentDistrict);
        }
    }

    // Public method to reset map view
    resetView() {
        this.clearVillageMarkers();
        this.currentDistrict = null;
        this.map.setView([23.5937, 80.9629], 5.2);
        this.infoPanel.style.display = 'none';
    }

    onDistrictHover(district) {
        // Draw circle using centroid and max distance to villages
        if (this.districtPolygon) {
            this.map.removeLayer(this.districtPolygon);
            this.districtPolygon = null;
        }
        if (district.villages && district.villages.length > 0) {
            const centroid = district.coordinates;
            // Calculate max distance from centroid to any village (in meters)
            let maxDist = 0;
            district.villages.forEach(v => {
                const dist = this.map.distance(centroid, v.coordinates);
                if (dist > maxDist) maxDist = dist;
            });
            // Add a little padding to the radius
            const radius = maxDist * 1.15;
            this.districtPolygon = L.circle(centroid, {
                radius: radius,
                color: '#6C63FF',
                weight: 3,
                fill: true,
                fillColor: '#6C63FF',
                fillOpacity: 0.15,
                dashArray: '8 6',
            }).addTo(this.map);
        }
    }

    onDistrictHoverOut() {
        if (this.districtPolygon) {
            this.map.removeLayer(this.districtPolygon);
            this.districtPolygon = null;
        }
    }

    // Animate marker from startLatLng to endLatLng over duration (ms)
    animateMarkerMove(marker, startLatLng, endLatLng, duration) {
        const start = performance.now();
        const animate = (now) => {
            const t = Math.min((now - start) / duration, 1);
            // Ease in-out cubic
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const lat = startLatLng[0] + (endLatLng[0] - startLatLng[0]) * ease;
            const lng = startLatLng[1] + (endLatLng[1] - startLatLng[1]) * ease;
            marker.setLatLng([lat, lng]);
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                marker.setLatLng(endLatLng);
            }
        };
        requestAnimationFrame(animate);
    }

    // Animate all village markers back to centroid, then remove
    animateVillagesToCentroidAndRemove(onComplete) {
        if (!this.currentDistrict) {
            if (onComplete) onComplete();
            return;
        }
        const centroid = this.currentDistrict.coordinates;
        const duration = 1200;
        let finished = 0;
        const total = this.villageMarkers.length;
        let called = false;
        const done = () => {
            if (!called) {
                called = true;
                this.villageMarkers.forEach(marker => {
                    if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
                });
                this.villageMarkers = [];
                if (onComplete) onComplete();
            }
        };
        this.villageMarkers.forEach((marker, i) => {
            const startLatLng = marker.getLatLng();
            this.animateMarkerMove(marker, [startLatLng.lat, startLatLng.lng], centroid, duration);
            setTimeout(() => {
                if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
                finished++;
                if (finished === total) {
                    done();
                }
            }, duration + 50);
        });
        // Failsafe: after max duration, forcibly remove all
        setTimeout(() => {
            done();
        }, duration + 500);
    }
}

// Initialize map when DOM is loaded
let mapInstance;
document.addEventListener('DOMContentLoaded', function() {
    // Load map data and initialize
    if (typeof mapData !== 'undefined') {
        mapInstance = new InteractiveMap('map', mapData);
    }
}); 