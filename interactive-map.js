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
                    {src: 'images/Ratangarh/9.jpg', caption: 'Visit Ratangarh for the traditional water body.'},
                    {src: 'images/Ratangarh/3.jpg', caption: 'Sethani Ka Johar - community engagement.'},
                    {src: 'images/Ratangarh/10.jpg', caption: 'Sethani Ka Johar - historic reservoir.', viewAll: true}
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
                <div class="mathania-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                    <button class="mathania-main-tab active" data-main-tab="joon">Joon ki Bawadi</button>
                    <button class="mathania-main-tab" data-main-tab="thulai">Thulai Nadi</button>
                    <button class="mathania-main-tab" data-main-tab="ghadai">Ghadai Nadi</button>
                </div>
                <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
                    <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
                    <div class="ratangarh-image-row" style="height:100%;"></div>
                    <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
                </div>
                <div class="ratangarh-tabs"></div>
                <div class="ratangarh-tab-content" id="ratangarh-tab-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => { // Wait for DOM
                // Prepare images for Salawas main tabs
                const joonImages = [
                    {src: 'images/Salawas/1.jpg', caption: 'Joon ki Bawadi – Salawas, Jodhpur'},
                    {src: 'images/Salawas/2.jpg', caption: 'Traditional stepwell structure, partially submerged.'},
                    {src: 'images/Salawas/3.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const thulaiImages = [
                    {src: 'images/Salawas/4.jpg', caption: 'Thulai Nadi – Krishna Nagar, Salawas'},
                    {src: 'images/Salawas/5.jpg', caption: 'Traditional nadi structure.'},
                    {src: 'images/Salawas/6.jpg', caption: 'Current state of the Nadi.', viewAll: true}
                ];
                const ghadaiImages = [
                    {src: 'images/Salawas/7.jpg', caption: 'Ghadai Nadi – Salawas'},
                    {src: 'images/Salawas/8.jpg', caption: 'Traditional rainwater harvesting structure.'},
                    {src: 'images/Salawas/9.jpg', caption: 'Current state of the Nadi.', viewAll: true}
                ];
                const imageRow = villageInfo.querySelector('.ratangarh-image-row');
                // Arrow logic
                let currentIndex = 0;
                const leftArrow = villageInfo.querySelector('.ratangarh-arrow-left');
                const rightArrow = villageInfo.querySelector('.ratangarh-arrow-right');
                function updateArrows() {
                    leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
                    rightArrow.style.display = currentIndex < 2 ? 'flex' : 'none';
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
                
                // Main-tab aware rendering for Salawas (Joon ki Bawadi | Thulai Nadi | Ghadai Nadi)
                const tabsContainer = villageInfo.querySelector('.ratangarh-tabs');
                const tabContent = villageInfo.querySelector('#ratangarh-tab-content');
                
                function renderSalawasMainTab(mainTab) {
                    // Render images
                    imageRow.innerHTML = '';
                    let imgs;
                    switch(mainTab) {
                        case 'joon':
                            imgs = joonImages;
                            break;
                        case 'thulai':
                            imgs = thulaiImages;
                            break;
                        case 'ghadai':
                            imgs = ghadaiImages;
                            break;
                        default:
                            imgs = joonImages;
                    }
                    imgs.forEach((img, i) => {
                        const box = document.createElement('div');
                        box.className = 'ratangarh-img-box';
                        box.innerHTML = `<img src='${img.src}' alt='Salawas Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption || ''}</div>`;
                        if (img.viewAll) {
                            const btn = document.createElement('a');
                            btn.href = 'salawas.html';
                            btn.className = 'view-all-photos-btn';
                            btn.textContent = 'View All Photos';
                            box.appendChild(btn);
                        }
                        imageRow.appendChild(box);
                    });
                    scrollToIndex(0);
                    updateArrows();
                    
                    // Render sub-tabs
                    tabsContainer.innerHTML = `
                        <button class="ratangarh-tab active" data-tab="overview">Overview</button>
                        <button class="ratangarh-tab" data-tab="history">📜 History of Waterbody</button>
                        <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
                        <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
                        <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
                        <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
                        <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>`;
                    
                    // Tab data for Joon ki Bawadi
                    const joonTabData = {
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
                    
                    // Tab data for Thulai Nadi
                    const thulaiTabData = {
                        overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                            <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                                <tr><th>Location</th><td>Thulai Nadi (Krishna Nagar), Salawas</td></tr>
                                <tr><th>District</th><td>Jodhpur</td></tr>
                                <tr><th>Latitude</th><td>26.121780</td></tr>
                                <tr><th>Longitude</th><td>72.998051</td></tr>
                            </table>
                            Thulai Nadi is a traditional water body serving the local community in Krishna Nagar, Salawas.<br/><br/>`,
                        history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Thulai Nadi is over a century old and was constructed to cover an extensive area of 15–20 bighas. It was historically an essential source for drinking water, irrigation, and cattle.<br/><br/>`,
                        uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Although saline water has reduced its usability, it is still partially used by the community.</li></ul>`,
                        religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>This water body was once considered a lifeline for the local community and continues to hold cultural value.</li></ul>`,
                        tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>It has limited tourism appeal, serving more as a functional water body than a heritage site.</li></ul>`,
                        science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>The nadi features a central submerged well, estimated to be 120–150 feet deep, that recharges during rainfall.</li><li>This is a remarkable example of traditional engineering.</li></ul>`,
                        condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Water quality is saline, but it remains partially functional and in use.</li></ul>`
                    };
                    
                    // Tab data for Ghadai Nadi
                    const ghadaiTabData = {
                        overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                            <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                                <tr><th>Location</th><td>Ghadai/Gudhai Nadi, Salawas</td></tr>
                                <tr><th>District</th><td>Jodhpur</td></tr>
                                <tr><th>Latitude</th><td>26.121780</td></tr>
                                <tr><th>Longitude</th><td>72.998051</td></tr>
                            </table>
                            Ghadai Nadi is one of the oldest rainwater harvesting structures in the region, showcasing how ancient communities managed seasonal water supply.<br/><br/>`,
                        history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>One of the oldest rainwater harvesting structures in the region, this nadi showcases how ancient communities managed seasonal water supply.<br/><br/>`,
                        uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Today, it is used mainly for cattle, but its design and location demonstrate the community's water management skills.</li></ul>`,
                        religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>It holds local heritage value as part of traditional rural life.</li></ul>`,
                        tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Moderate tourism opportunities exist if it is promoted as a cultural heritage site.</li></ul>`,
                        science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Its traditional design captures and stores seasonal rainfall, reflecting sustainable resource management.</li></ul>`,
                        condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>The nadi is still managed seasonally by locals, showing community involvement.</li></ul>`
                    };
                    
                    let data;
                    switch(mainTab) {
                        case 'joon':
                            data = joonTabData;
                            break;
                        case 'thulai':
                            data = thulaiTabData;
                            break;
                        case 'ghadai':
                            data = ghadaiTabData;
                            break;
                        default:
                            data = joonTabData;
                    }
                    
                    function setTab(tab) {
                        tabContent.innerHTML = data[tab];
                        villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
                        villageInfo.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
                    }
                    setTab('overview');
                    villageInfo.querySelectorAll('.ratangarh-tab').forEach(btn => {
                        btn.onclick = () => setTab(btn.getAttribute('data-tab'));
                    });
                }
                
                // Initialize and bind main tabs
                renderSalawasMainTab('joon');
                villageInfo.querySelectorAll('.mathania-main-tab').forEach(btn => {
                    btn.onclick = () => {
                        villageInfo.querySelectorAll('.mathania-main-tab').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderSalawasMainTab(btn.getAttribute('data-main-tab'));
                    };
                });
            }, 0);
        }
        
        else if (village.id === 'osian') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="mathania-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
                    <button class="mathania-main-tab active" data-main-tab="katan">Katan Bawadi</button>
                    <button class="mathania-main-tab" data-main-tab="badi">Badi Nadi</button>
                </div>
                <div class="mathania-bawadi-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => {
                // Images for Osian
                const katanImages = [
                    {src: 'images/Osian/2.jpg', caption: 'Katan Bawadi – Osian Village'},
                    {src: 'images/Osian/13.jpg', caption: 'Traditional stepwell structure, Osian.'},
                    {src: 'images/Osian/3.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const badiImages = [
                    {src: 'images/Osian/19.jpg', caption: 'Badi Nadi – Osian Village'},
                    {src: 'images/Osian/23.jpg', caption: 'Traditional waterbody structure.'},
                    {src: 'images/Osian/4.jpg', caption: 'Present condition of the Nadi.', viewAll: true}
                ];
                // Tab content for Katan Bawadi
                const katanTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Katan Bawadi, Osian Village</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.2756</td></tr>
                            <tr><th>Longitude</th><td>72.9989</td></tr>
                        </table>
                        Katan Bawadi is a traditional stepwell located in Osian Village, built in the 10th century, making it one of Rajasthan's oldest stepwells. It exhibits traditional Rajput and early medieval craftsmanship, though simpler compared to Chand Baori (Abhaneri).<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Built in the 10th century, making it one of Rajasthan's oldest stepwells. Exhibits traditional Rajput and early medieval craftsmanship, though simpler compared to Chand Baori (Abhaneri). Once served as a community water source for drinking, rituals, and spiritual purposes.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Still associated with ritual use, but water quality has deteriorated due to offerings and materials used in ceremonies.</li><li>No longer used for drinking water due to pollution.</li><li>Limited community use due to poor water quality.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Site for Hindu rituals and spiritual bathing.</li><li>Holds cultural importance as one of Osian's earliest water heritage sites.</li><li>Considered sacred by local community.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Historical stepwell with architectural charm, potential for heritage tourism if cleaned and restored.</li><li>Can be developed alongside Osian's existing temple tourism.</li><li>Architectural photography opportunities.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Traditional stepwell design with large capacity.</li><li>Estimated area: (~50-80 m length, 50–60m breadth).</li><li>Ancient water conservation engineering.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Poor cleanliness due to ritual waste.</li><li>Structural integrity fair, but requires restoration.</li><li>Water quality deteriorated due to pollution.</li></ul>`
                };
                // Tab content for Badi Nadi
                const badiTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Badi Nadi, Osian Village</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.2756</td></tr>
                            <tr><th>Longitude</th><td>72.9989</td></tr>
                        </table>
                        Badi Nadi is the oldest waterbody in Osian Village, built about a century ago. Originally constructed as a community water source in the arid desert region, it served as a lifeline for villagers, reflecting traditional water conservation practices.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Badi Nadi is the oldest waterbody in Osian Village, built about a century ago. Originally constructed as a community water source in the arid desert region. Served as a lifeline for villagers, reflecting traditional water conservation practices.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Used for Hindu rituals and spiritual purposes.</li><li>Still holds occasional community gatherings.</li><li>No longer reliable for drinking or daily use due to pollution.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Considered sacred and closely tied to Hindu customs.</li><li>Frequently used for ritual baths, offerings, and religious ceremonies.</li><li>Symbolizes spiritual purity and cultural heritage of Osian.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Located in Osian, known for temples and desert heritage.</li><li>Can be developed as a heritage site alongside existing tourist attractions.</li><li>Restoration and beautification could draw cultural and eco-tourists.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Covers about 1–2 bighas of land.</li><li>Approximate dimensions: 200 m length × 50–60 m breadth.</li><li>Traditional design enabled collection and long-term storage of rainwater.</li><li>Example of indigenous water engineering adapted to desert conditions.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Presently in a polluted state due to ritual waste and lack of maintenance.</li><li>Water is not clean or usable for domestic purposes.</li><li>Requires urgent restoration and waste management for revival.</li></ul>`
                };
                // Render main tab content
                function renderBawadiTab(mainTab) {
                    const contentDiv = villageInfo.querySelector('.mathania-bawadi-content');
                    // Images and sub-tabs
                    const imgs = mainTab === 'katan' ? katanImages : badiImages;
                    const tabData = mainTab === 'katan' ? katanTabData : badiTabData;
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
                        box.innerHTML = `<img src='${img.src}' alt='Osian Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                        if (img.viewAll) {
                            const btn = document.createElement('a');
                            btn.href = 'osian.html';
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
                renderBawadiTab('katan');
                villageInfo.querySelectorAll('.mathania-main-tab').forEach(btn => {
                    btn.onclick = () => {
                        villageInfo.querySelectorAll('.mathania-main-tab').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderBawadiTab(btn.getAttribute('data-main-tab'));
                    };
                });
            }, 0);
        }

        else if (village.id === 'mathania') {
            villageInfo.innerHTML = `
                <div class="village-header">
                    <h3>${village.name}</h3>
                    <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
                </div>
                <div class="mathania-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
                    <button class="mathania-main-tab active" data-main-tab="chhoti">Chhoti Nadi</button>
                    <button class="mathania-main-tab" data-main-tab="aaba">Aaba Nadi</button>
                    <button class="mathania-main-tab" data-main-tab="chhoti-bawadi">Chhoti Bawadi</button>
                    <button class="mathania-main-tab" data-main-tab="ayurvedic">Purana Ayurvedic Bawadi</button>
                    <button class="mathania-main-tab" data-main-tab="houses">Houses Built Over Bawadis</button>
                    <button class="mathania-main-tab" data-main-tab="karni">Karni Mata Mandir</button>
                    
                </div>
                <div class="mathania-bawadi-content"></div>
                <div class="village-actions">
                    <a href="${village.report}" class="view-report-btn">View Full Report</a>
                    <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
                </div>
            `;
            setTimeout(() => {
                // Images for Mathania sections
                const chhotiImages = [
                    {src: 'images/Mathania/1.jpg', caption: 'Chhoti Nadi – Mathania, Rajasthan'},
                    {src: 'images/Mathania/2.jpg', caption: 'Regenerated village nadi.'},
                    {src: 'images/Mathania/3.jpg', caption: 'Current state of the Nadi.', viewAll: true}
                ];
                const aabaImages = [
                    {src: 'images/Mathania/4.jpg', caption: 'Aaba Nadi – Mathania'},
                    {src: 'images/Mathania/5.jpg', caption: 'Traditional nadi structure.'},
                    {src: 'images/Mathania/6.jpg', caption: 'Present condition of the Nadi.', viewAll: true}
                ];
                const chhotiBawadiImages = [
                    {src: 'images/Mathania/7.jpg', caption: 'Chhoti Bawadi – Mathania'},
                    {src: 'images/Mathania/8.jpg', caption: 'Historical stepwell structure.'},
                    {src: 'images/Mathania/9.jpg', caption: 'Current state of the Bawadi.', viewAll: true}
                ];
                const ayurvedicImages = [
                    {src: 'images/Mathania/10.jpg', caption: 'Purana Ayurvedic Bawadi – Mathania'},
                    {src: 'images/Mathania/11.jpg', caption: 'Temple-associated stepwell.'},
                    {src: 'images/Mathania/12.jpg', caption: 'Present condition of the Bawadi.', viewAll: true}
                ];
                const housesImages = [
                    {src: 'images/Mathania/16.jpg', caption: 'Houses Built Over Bawadis – Mathania'},
                    {src: 'images/Mathania/14.jpg', caption: 'Urban encroachment on heritage structures.'},
                    {src: 'images/Mathania/15.jpg', caption: 'Lost heritage sites.', viewAll: true}
                ];
                const karniImages = [
                    {src: 'images/Mathania/13.jpg', caption: 'Karni Mata – Mathania'},
                    {src: 'images/Mathania/17.jpg', caption: 'Temple-associated stepwell.'},
                    {src: 'images/Mathania/18.jpg', caption: 'Present condition of the Bawadi.', viewAll: true}
                ];
                // Tab content for Chhoti Nadi
                const chhotiTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Chhoti Nadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Chhoti Nadi is an old village nadi that has been regenerated by the local Sarpanch. It serves as a community water source and cultural gathering spot for villagers.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Old village nadi regenerated by local Sarpanch.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Primarily for community cooling and occasional rituals.</li><li>Seasonal water availability.</li><li>Community gathering spot.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Cultural gathering spot for villagers.</li><li>Used for occasional rituals.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Limited tourism potential unless combined with heritage trails.</li><li>Could be part of rural tourism programs.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Basic earthen rainwater storage.</li><li>Traditional water conservation method.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Seasonal water availability.</li><li>Relatively clean after regeneration.</li><li>Well-maintained by local community.</li></ul>`
                };
                
                // Tab content for Aaba Nadi
                const aabaTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Aaba Nadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Aaba Nadi is one of Mathania's oldest nadis, regenerated under MNREGA. Historically the largest water body in the village.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>One of Mathania's oldest nadis, regenerated under MNREGA. Historically the largest water body in the village.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Seasonal water use for livestock.</li><li>Community gathering during festivals.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Community gathering during festivals.</li><li>Cultural importance to local community.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Could be integrated into rural tourism programs.</li><li>Heritage site potential.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Large-scale traditional nadi design.</li><li>Traditional water conservation engineering.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Seasonal filling.</li><li>Moderate siltation.</li><li>Requires regular maintenance.</li></ul>`
                };
                
                // Tab content for Chhoti Bawadi
                const chhotiBawadiTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Chhoti Bawadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Chhoti Bawadi is a historical bawadi that was used before piped water systems were introduced. Previously a central water source for all community rituals.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Chhoti Bawadi in Mathania is considered one of the oldest stepwells in the region, constructed during a time when piped water supply systems did not exist. It served as a crucial water source for the local population, particularly during dry summers, and symbolized the ingenuity of traditional water-harvesting architecture. Stepwells like this were not merely utilitarian but also spaces of social and cultural gatherings, emphasizing their importance in community life.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Completely unused today; original function lost.</li><li>Has become a dumping ground for household and commercial waste.</li><li>Physical structure and surroundings severely degraded.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Historically held spiritual value as a sacred communal hub.</li><li>Often associated with nearby temples.</li><li>Used for ritual purification before religious activities.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>High potential as a heritage landmark if restored.</li><li>Can attract domestic and international visitors interested in ancient water architecture.</li><li>Opportunity for interpretive signage and cultural trails.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Demonstrates early understanding of percolation and groundwater recharge.</li><li>Exhibits traditional water engineering suited for arid regions.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Heavily polluted and filled with garbage.</li><li>Completely abandoned and non-functional.</li><li>Urgent restoration and protection measures required.</li></ul>`
                };
                
                // Tab content for Purana Ayurvedic Bawadi
                const ayurvedicTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Purana Ayurvedic Bawadi & Karni Mata Ji Temple Bawadi, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Both historically important stepwells associated with temple premises. Require thorough documentation and cleaning.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>This historic bawadi is closely associated with Ayurvedic practices, indicating that it was once valued not only as a water source but also for its supposed therapeutic properties. It is an important reminder of how water management and health traditions were interlinked in ancient India.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Currently neglected; serves no functional purpose.</li><li>Encroachment and lack of maintenance have damaged the structure and aesthetics.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Historically connected to the Karni Mata Temple area.</li><li>Used by pilgrims and temple visitors in earlier times.</li><li>Holds cultural and spiritual value.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>High potential with cleaning, structural restoration, and proper promotion.</li><li>Ayurvedic link can attract wellness and heritage tourism.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Traditional water-storage system reflecting holistic health practices.</li><li>Demonstrates natural and sustainable water management suited to the region.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Heavily encroached and abandoned.</li><li>In urgent need of conservation and restoration.</li></ul>`
                };
                
                // Tab content for Houses Built Over Bawadis
                const housesTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Houses Built Over Unknown Bawadis (1, 2, 3), Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        Represents urban encroachment on heritage structures. Stepwells dried up and converted into residential/commercial space.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>Several ancient bawadis in Mathania have been lost over time due to rapid urbanization and modernization. These stepwells, once critical for community survival, now lie beneath houses and commercial complexes, completely erasing their existence from the public eye.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Land above the stepwells has been repurposed for residential and commercial construction.</li><li>The bawadis are inaccessible and non-functional.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>Represents cultural loss; religious and communal roles have vanished.</li><li>Historical connections to community rituals are effectively erased.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Minimal tourism potential as they are buried and inaccessible.</li><li>Potential only if archaeological surveys/excavations are initiated.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Highlights how modern development overlooked sustainable traditional water systems.</li><li>Underscores the need to integrate heritage-sensitive planning.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Mostly encroached upon and structurally damaged or destroyed.</li><li>Invisible reminders of neglected heritage with no public access.</li></ul>`
                };
                const karniTabData = {
                    overview: `<b style='color:#2a5d9f;'>Overview</b><br/>
                        <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                            <tr><th>Location</th><td>Karni Mata Mandir, Mathania</td></tr>
                            <tr><th>District</th><td>Jodhpur</td></tr>
                            <tr><th>Latitude</th><td>26.526706</td></tr>
                            <tr><th>Longitude</th><td>72.980735</td></tr>
                        </table>
                        The Karni Mata Mandir at Mathania has long been a traditional site for worship and community gatherings, serving as a center of local faith and heritage.<br/><br/>`,
                    history: `<b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>The Karni Mata Mandir at Mathania has long been a traditional site for worship and community gatherings, serving as a center of local faith and heritage.<br/><br/>`,
                    uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>The temple premises continue to be used for religious rituals and traditional community activities.</li><li>Unfortunately, in recent years, it has also become a dumping ground for garbage, diminishing its sanctity.</li></ul>`,
                    religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><ul><li>The site is considered sacred, dedicated to Karni Mata, and holds spiritual value for local devotees who perform rituals and religious ceremonies there.</li><li>Used for religious rituals and traditional community activities.</li></ul>`,
                    tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>With proper restoration and maintenance, the Karni Mata Mandir could emerge as a cultural and heritage tourism destination, attracting pilgrims and visitors interested in regional traditions and history.</li><li>Could be part of rural tourism programs.</li></ul>`,
                    science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>The site reflects the traditional religious architecture and cultural practices of the region, offering insights into local heritage preservation.</li><li>Demonstrates traditional religious architecture and cultural practices.</li></ul>`,
                    condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>At present, the temple area is degraded due to improper waste disposal and lack of management. This has reduced its spiritual atmosphere and threatens its potential as a cultural and tourism hub.</li><li>Degraded due to improper waste disposal and lack of management.</li></ul>`
                };
                
                // Render main tab content
                function renderBawadiTab(mainTab) {
                    const contentDiv = villageInfo.querySelector('.mathania-bawadi-content');
                    // Images and sub-tabs based on main tab
                    let imgs, tabData;
                    switch(mainTab) {
                        case 'chhoti':
                            imgs = chhotiImages;
                            tabData = chhotiTabData;
                            break;
                        case 'aaba':
                            imgs = aabaImages;
                            tabData = aabaTabData;
                            break;
                        case 'chhoti-bawadi':
                            imgs = chhotiBawadiImages;
                            tabData = chhotiBawadiTabData;
                            break;
                        case 'ayurvedic':
                            imgs = ayurvedicImages;
                            tabData = ayurvedicTabData;
                            break;
                        case 'houses':
                            imgs = housesImages;
                            tabData = housesTabData;
                            break;
                        case 'karni':
                            imgs = karniImages;
                            tabData = karniTabData;
                            break;
                         default:
                            imgs = chhotiImages;
                            tabData = chhotiTabData;
                    }
                    
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
                let currentMainTab = 'chhoti';
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
                    {src: 'images/Ramgarh/1.jpg', caption: 'Kshatriyoon ki Nadi – Ramgarh, Jaisalmer'},
                    {src: 'images/Ramgarh/2.jpg', caption: 'Traditional rain-fed tank, Ramgarh.'},
                    {src: 'images/Ramgarh/3.jpg', caption: 'Current state of the Nadi.', viewAll: true}
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
                        <div class="kelwa-main-tabs">
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
                    {src: 'images/Kelwa/1.jpg', caption: 'Roop Sagar – Kelwa, Rajasthan'},
                    {src: 'images/Kelwa/2.jpg', caption: 'Traditional man-made lake, Kelwa.'},
                    {src: 'images/Kelwa/3.jpg', caption: 'Current state of Roop Sagar.', viewAll: true}
                ];
                const dholiImages = [
                    {src: 'images/Kelwa/4.jpg', caption: 'Dholi Bawadi – Kelwa, Rajasthan'},
                    {src: 'images/Kelwa/5.jpg', caption: 'Traditional stepwell structure, Dholi Bawadi.'},
                    {src: 'images/Kelwa/6.jpg', caption: 'Current state of Dholi Bawadi.', viewAll: true}
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
else if (village.id === 'rajsamand_village') {
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
            {src: 'images/Dadrewa/1.jpg', caption: 'View of Daab, Dadrewa'},
            {src: 'images/Dadrewa/2.jpg', caption: 'Gorkh Ganga Daab during monsoon'},
            {src: 'images/Dadrewa/3.jpg', caption: 'Community gathering at Daab', viewAll: true}
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
            {src: 'images/Rajnagar/1.jpg', caption: 'Ood Bawadi Stepwell, Rajnagar'},
            {src: 'images/Rajnagar/2.jpg', caption: 'Intricate stonework of Ood Bawadi'},
            {src: 'images/Rajnagar/3.jpg', caption: 'Community event at Ood Bawadi', viewAll: true}
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
            {src: 'images/Amet/1.jpg', caption: 'Rajon Ki Bawadi, Amet'},
            {src: 'images/Amet/2.jpg', caption: 'Stone masonry and steps of Rajon Ki Bawadi'},
            {src: 'images/Amet/3.jpg', caption: 'Heritage architecture of the stepwell', viewAll: true}
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
            {src: 'images/Khejarala/1.jpg', caption: 'Khejarla village (jodhpur) Map'},
            {src: 'images/Khejarala/16.jpg', caption: 'Jinn Ka Bera - legendary well'},
            {src: 'images/Khejarala/3.jpg', caption: 'Traditional Tanka and Nadi', viewAll: true}
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
            {src: 'images/Siyai/1.jpg', caption: 'Traditional Tanka in Siyai'},
            {src: 'images/Siyai/2.jpg', caption: 'Rainwater harvesting system'},
            {src: 'images/Siyai/3.jpg', caption: 'Desert water conservation', viewAll: true}
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

else if (village.id === 'sangariya') {
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
            {src: 'images/Sangariya/1.jpg', caption: 'Traditional Nadi of Sangariya'},
            {src: 'images/Sangariya/2.jpg', caption: 'Village water heritage site'},
            {src: 'images/Sangariya/3.jpg', caption: 'Community water management', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Sangariya Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'sangariya.html';
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
                    <tr><th>Location</th><td>Sangariya, Jodhpur District</td></tr>
                    <tr><th>Latitude</th><td>26.3000</td></tr>
                    <tr><th>Longitude</th><td>73.0000</td></tr>
                </table>
                Sangariya is home to a traditional unnamed Nadi that once served as the village's primary water source. This waterbody represents the historical rainwater harvesting systems of rural Rajasthan and the transition to modern water infrastructure.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>The Unnamed Nadi of Sangariya was once a central water source for the village, fulfilling all daily human needs such as drinking, cooking, bathing, and washing.</li>
                    <li>It represents the traditional rainwater harvesting system commonly used across rural Rajasthan before piped water and modern supply systems became widespread.</li>
                    <li>The Nadi is part of the historical rural water heritage, symbolizing the self-sufficiency of past village communities.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Today, the Nadi is mainly used by animals, especially during dry seasons.</li>
                    <li>Due to urbanization and modern water supply systems, residents now receive clean, piped water, making reliance on the Nadi obsolete for human use.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>No specific religious activities are reported around this Nadi.</li>
                    <li>However, like many traditional water bodies in Rajasthan, the cultural reverence for water suggests that it may have once been considered sacred or socially significant in community rituals or festivals.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>As of now, the tourism potential is minimal due to the Nadi's unnamed and neglected status.</li>
                    <li>However, with proper documentation, signage, and ecological restoration, it could serve as a learning site for traditional water management practices.</li>
                    <li>A joint initiative by RetroFlow and local leaders (including the Sarpanch) could position it as part of a rural eco-tourism trail in the future.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The transition from traditional Nadi use to piped water systems provides a live example of rural water infrastructure evolution.</li>
                    <li>This shift raises important questions on sustainability, groundwater depletion, and community dependence on centralized systems.</li>
                    <li>It offers opportunities to study salinity issues in underground sources and the ecological role of abandoned water bodies in supporting livestock and biodiversity.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>The Nadi is still physically present, but its role is greatly reduced—it now serves primarily animals.</li>
                    <li>Its water is not suitable for human consumption, likely due to salinity or lack of maintenance.</li>
                    <li>The Sarpanch and Team RetroFlow (JCKIC) have initiated a dialogue for revival, blending local knowledge with innovative water conservation ideas—marking the first step toward rejuvenation.</li>
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
            {src: 'images/Ramsar/1.jpg', caption: 'Uttam Singh Model Pond'},
            {src: 'images/Ramsar/2.jpg', caption: 'Traditional Talab and Wells'},
            {src: 'images/Ramsar/3.jpg', caption: 'Community water heritage', viewAll: true}
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


else if (village.id === 'mandore') {
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
            {src: 'images/mandore/1.jpg', caption: 'Naganadi Canal in Mandore Garden'},
            {src: 'images/mandore/2.jpg', caption: 'Historic waterway and garden heritage'},
            {src: 'images/mandore/3.jpg', caption: 'Traditional water architecture', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Mandore Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'mandore.html';
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
                    <tr><th>Location</th><td>Mandore Garden, Jodhpur District</td></tr>
                    <tr><th>Latitude</th><td>26.3500</td></tr>
                    <tr><th>Longitude</th><td>73.0500</td></tr>
                </table>
                Mandore is home to the historic Naganadi canal, an ancient waterway flowing through the renowned Mandore Garden. This traditional water system represents the integration of utility and beauty in historical water architecture.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Naganadi is an ancient canal (waterway) flowing through the historic Mandore Garden.</li>
                    <li>It was originally constructed as a year-round water storage system and played a dual role—irrigation and aesthetic enhancement of the garden.</li>
                    <li>It represents a significant part of Mandore's water heritage, symbolizing the integration of utility and beauty in traditional water architecture.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>In its current state, Naganadi is not actively used for irrigation or water supply.</li>
                    <li>However, redevelopment plans aim to restore its functional and visual utility, focusing on cleanliness, aesthetic revival, and cultural engagement.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>While no specific rituals are detailed, Mandore Garden as a historical and sacred site (associated with ancient Marwar rulers and temples) adds cultural and spiritual weight to Naganadi.</li>
                    <li>Redevelopment involving ghats may also support religious gatherings or ceremonies in the future.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>High tourism potential: Naganadi is located in Mandore Garden, a popular tourist destination.</li>
                    <li>The Jodhpur Development Authority plans to build footbridges, ghats, and clean-up projects, aiming to re-establish Naganadi as a cultural and tourist hub.</li>
                    <li>Revived water flow and architectural restoration will enhance the visual and ecological appeal of the garden, drawing more visitors.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The canal reflects historical hydrological engineering, built to ensure year-round water availability in a semi-arid region.</li>
                    <li>Its redevelopment also touches on urban water management, combining heritage conservation with modern water-sensitive planning.</li>
                    <li>Can become a demonstration site for integrating traditional water bodies in urban resilience planning.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Presently, Naganadi is under redevelopment.</li>
                    <li>Jodhpur Development Authority is actively working on cleaning and restoring the canal, building ghats and pedestrian footbridges, and enhancing aesthetic and cultural value.</li>
                    <li>The waterway currently lacks active use, but revival efforts are in progress to transform it into a functional and cultural landmark.</li>
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

else if (village.id === 'shribalaji') {
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
            {src: 'images/Shribalaji/1.jpg', caption: 'Shree Balaji – Rectangular Cemented Tank'},
            {src: 'images/Shribalaji/2.jpg', caption: 'PVC pipe connections for rooftop harvesting'},
            {src: 'images/Shribalaji/3.jpg', caption: 'Sealed, clean storage tank', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Shri Balaji Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'shribalaji.html';
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
                    <tr><th>Location</th><td>Shri Balaji, Nagaur District</td></tr>
                    <tr><th>Latitude</th><td>27.398808</td></tr>
                    <tr><th>Longitude</th><td>73.532659</td></tr>
                </table>
                Shree Balaji – Rectangular Cemented Tank: a compact, modern rainwater harvesting and storage unit built in cement with sealed walls and PVC inlet piping. Designed primarily for rooftop runoff collection, it provides reliable clean-water storage for drinking and household use.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                Constructed less than 10 years ago, this tank represents household/community-level rainwater harvesting. Built of cement with PVC pipe connections, it reflects the shift towards modern small-scale harvesting rather than large communal ponds.<br/>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Collects rooftop rainwater and runoff.</li>
                    <li>Serves as clean water storage for drinking and domestic use.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                Located near Balaji region, occasionally linked to small temple rituals.<br/>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Limited direct tourism.</li>
                    <li>Valuable as a demonstration model for NGOs promoting micro-harvesting.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Compact design (3–4 m wide, 1.2–1.5 m high).</li>
                    <li>Sealed tank → prevents contamination.</li>
                    <li>Use of PVC pipes = modern engineering integration.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Functional and clean.</li>
                    <li>Storage capacity limited compared to Nadis.</li>
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

else if (village.id === 'alai') {
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
            {src: 'images/Alai/1.jpg', caption: 'Alai Nadi – seasonal water storage'},
            {src: 'images/Alai/2.jpg', caption: 'Masonry embankment and catchment siting'},
            {src: 'images/Alai/3.jpg', caption: 'Post-monsoon water holding', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Alai Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'alai.html';
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
                    <tr><th>Location</th><td>Alai Village, Nagaur District</td></tr>
                    <tr><th>Latitude</th><td>27.328257</td></tr>
                    <tr><th>Longitude</th><td>73.576669</td></tr>
                </table>
                Alai Village – Alai Nadi: a community rainwater storage system situated to capture catchment runoff and seasonal rainfall, supporting agriculture and local water needs.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                Built in January 2022 under MGNREGA at a cost of ₹2.84 lakh, this Nadi is 25×32 meters in size. Historically, Alai region has depended on Nadis and wells; this new structure revives that tradition but with government support.<br/>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Stores rainwater for agriculture, livestock, and groundwater recharge.</li>
                    <li>Used seasonally for supplementary irrigation.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                While not sacred, water from Nadis is traditionally used in community festivals for rituals like Gangaur and Teej.<br/>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Potential to become a learning site for water conservation NGOs, students, and researchers.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Smart placement in a catchment area.</li>
                    <li>Masonry embankment increases durability.</li>
                    <li>Water infiltration supports aquifer recharge.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Holds good water after monsoon.</li>
                    <li>Requires yearly maintenance to prevent siltation.</li>
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

else if (village.id === 'barani') {
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
            {src: 'images/Barani/1.jpg', caption: 'Kachauliya Nadi – reinforced masonry tank'},
            {src: 'images/Barani/2.jpg', caption: 'Circular layout and stone-lining detail'},
            {src: 'images/Barani/3.jpg', caption: 'Seasonal storage post-monsoon', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Barani Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'barani.html';
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
                    <tr><th>Location</th><td>Barani Village – Kachauliya Nadi, Nagaur District</td></tr>
                    <tr><th>Latitude</th><td>27.290657</td></tr>
                    <tr><th>Longitude</th><td>73.618387</td></tr>
                </table>
                Kachauliya Nadi is a circular, reinforced water structure serving as seasonal storage and recharge for the Barani region.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                Kachauliya Nadi is a cemented and stone masonry water structure built under MGNREGA around 2020–21. Though newly constructed, it continues the ancient tradition of Nadis in Rajasthan, which for centuries have been shallow depressions dug at the village outskirts to collect rainwater. Unlike old earthen Nadis, this one uses cement reinforcement and stone masonry, preventing erosion and seepage — a modern twist to a traditional idea.<br/>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Stores monsoon rainwater.</li>
                    <li>Primary source for cattle drinking water, domestic needs, and limited irrigation.</li>
                    <li>Supports local ecology by percolating water into shallow aquifers.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                While not directly tied to a temple, Nadis like this hold cultural value. Traditionally, after the first rainfall, villagers perform small rituals at water bodies, thanking nature.<br/>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Limited, but could be part of eco-tourism and water heritage tours highlighting modern revival of old systems.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Circular shape ensures uniform water pressure on walls.</li>
                    <li>Reinforced masonry prevents soil erosion.</li>
                    <li>Functions like a mini check-dam, recharging groundwater.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Adequate water storage post-monsoon.</li>
                    <li>In summers, dries partially due to low rainfall dependency.</li>
                    <li>Clean water, but vulnerable to pollution if cattle enter directly.</li>
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

else if (village.id === 'gogelaw') {
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
			<button class="ratangarh-tab" data-tab="history">📜 History of Waterbodies</button>
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
			{src: 'images/Gogelaw/1.jpg', caption: 'Adarsh Talaab – communal reservoir'},
			{src: 'images/Gogelaw/14.png', caption: 'Dual-pipe culvert for drainage and flood control'},
			{src: 'images/Gogelaw/3.jpg', caption: 'Traditional circular wells and household tankas', viewAll: true}
		];
		const imageRow = villageInfo.querySelector('.ratangarh-image-row');
		images.forEach((img, i) => {
			const box = document.createElement('div');
			box.className = 'ratangarh-img-box';
			box.innerHTML = `<img src='${img.src}' alt='Gogelaw Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
			if (img.viewAll) {
				const btn = document.createElement('a');
				btn.href = 'gogelaw.html';
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
					<tr><th>Location</th><td>Gogelaw Village – Adarsh Talaab, Nadis, Wells, and Tanka (Nagaur)</td></tr>
					<tr><th>Latitude</th><td>27.239266</td></tr>
					<tr><th>Longitude</th><td>73.651575</td></tr>
				</table>
				Gogelaw hosts a network of traditional and modern water systems including the expansive Adarsh Talaab, historic nadis, household tankas, and red sandstone wells.<br/><br/>
			`,
			history: `
				<b style='color:#2a5d9f;'>📜 History of the Waterbodies</b><br/>
				<ul>
					<li>Gogelaw is home to some of the oldest johads/nadis in Nagaur, dating back 300–600 years, with oral history suggesting even 1,000 years.</li>
					<li>The Adarsh Talaab, spanning 2000 bighas, is among the largest communal water bodies in Marwar.</li>
					<li>Inscriptions show new structures were built under MGNREGA (2014–15).</li>
					<li>Wells built from red sandstone (10–30 years old) add to its heritage.</li>
				</ul>
			`,
			uses: `
				<b style='color:#2a5d9f;'>💧 Current Uses</b>
				<ul>
					<li>Adarsh Talaab: Cattle grazing, water storage, recharge.</li>
					<li>Tanka: Potable water storage for households.</li>
					<li>Wells: Domestic water supply, partial irrigation.</li>
				</ul>
			`,
			religion: `
				<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
				<ul>
					<li>Goga Talab dedicated to Gogaji, Rajasthan’s snake-deity, worshipped as protector.</li>
					<li>Site of annual pilgrimages and fairs.</li>
				</ul>
			`,
			tourism: `
				<b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
				<ul>
					<li>Very high — combination of heritage, faith, and ecosystems.</li>
					<li>Could be promoted as a heritage tourism circuit around Gogaji.</li>
				</ul>
			`,
			science: `
				<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
				<ul>
					<li>Dual-pipe culvert for drainage and flood control.</li>
					<li>Large catchment design for maximum rainwater storage.</li>
					<li>Traditional circular wells ensure year-round access.</li>
				</ul>
			`,
			condition: `
				<b style='color:#2a5d9f;'>📊 Current Condition</b>
				<ul>
					<li>Adequate storage post-monsoon.</li>
					<li>Risk of drying and siltation in summers.</li>
					<li>Pollution risk from open grazing.</li>
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

else if (village.id === 'beer') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="beer-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
            <button class="beer-main-tab active" data-main-tab="well">Ancient Well (Beer Panchayat)</button>
            <button class="beer-main-tab" data-main-tab="bawdi">Beer Stepwell (Bawdi)</button>
            <button class="beer-main-tab" data-main-tab="phool">Phool Sagar (Reservoir)</button>
        </div>
        <div class="beer-section-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Images for Beer
        const wellImages = [
            {src: 'images/Beer/1.jpg', caption: 'Ancient circular well – heritage structure'},
            {src: 'images/Beer/2.jpg', caption: 'Well masonry and current condition'},
            {src: 'images/Beer/3.jpg', caption: 'Overgrown and garbage-filled, needs revival', viewAll: true}
        ];
        const bawdiImages = [
            {src: 'images/Beer/4.jpg', caption: 'Beer Stepwell (Bawdi) – historic access steps'},
            {src: 'images/Beer/5.jpg', caption: 'Traditional cooling architecture'},
            {src: 'images/Beer/6.jpg', caption: 'Silted and neglected; restoration needed', viewAll: true}
        ];
        const phoolImages = [
            {src: 'images/Beer/7.jpg', caption: 'Phool Sagar – large reservoir expanse'},
            {src: 'images/Beer/8.jpg', caption: 'Stone embankments and catchment area'},
            {src: 'images/Beer/9.jpg', caption: 'Functional reservoir; water quality concerns', viewAll: true}
        ];

        // Tab data per main section
        const wellTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Ancient Well (Beer Panchayat), Beer Village</td></tr>
                    <tr><th>District</th><td>Ajmer</td></tr>
                    <tr><th>Latitude</th><td>26.390705</td></tr>
                    <tr><th>Longitude</th><td>74.729613</td></tr>
                </table>
                This well, estimated to be 200–500 years old, is the oldest water structure in Beer Panchayat. Once the sole source of drinking water and domestic use, it now stands dry due to falling groundwater levels and neglect.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History</b><br/>
                200–500 years old; generations relied on it before pipelines and modern schemes. Oral histories highlight its central role in Beer’s past water security.<br/>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>None; dried and abandoned.</li></ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Considered a heritage well; historically used in rituals.<br/>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Low unless revived as a heritage/educational site.</li></ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Traditional masonry circular well tapping shallow aquifer.</li></ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Dry, cracked walls; garbage-filled; overgrown vegetation.</li></ul>
                <br/><b>Solution:</b> Desilting, heritage conservation, safety railing, community cleanup, explore recharge-well revival.
            `
        };
        const bawdiTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Beer Stepwell (Bawdi), Beer Village</td></tr>
                    <tr><th>District</th><td>Ajmer</td></tr>
                    <tr><th>Latitude</th><td>26.390705</td></tr>
                    <tr><th>Longitude</th><td>74.729613</td></tr>
                </table>
                A 400-year-old stepwell that once served as the community’s lifeline for drinking, irrigation, and livestock—now neglected and silted.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History</b><br/>
                400 years old; architectural design ensured cool storage and access in summers. Symbol of Beer’s community-based conservation.
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Abandoned; not in use.</li></ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Culturally linked to village identity.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>High if restored (heritage tourism, stepwell circuit).</li></ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Stepwell design minimized evaporation and allowed year-round access.</li></ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Garbage-filled; silted; overgrown.</li></ul>
                <br/><b>Solution:</b> Cleaning, desilting, heritage tourism project, awareness drives, integrate modern rainwater harvesting.
            `
        };
        const phoolTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Phool Sagar (Reservoir), near Beer Panchayat</td></tr>
                    <tr><th>District</th><td>Ajmer</td></tr>
                    <tr><th>Latitude</th><td>26.390705</td></tr>
                    <tr><th>Longitude</th><td>74.729613</td></tr>
                </table>
                A 500+ year-old reservoir likely built by local royals; still functional for storage and recharge, but faces water quality challenges.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History</b><br/>
                500+ years old; large-scale rainwater reservoir with stone embankments supporting irrigation and domestic needs historically.
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Irrigation, livestock, groundwater recharge.</li></ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Likely linked to local rituals/fairs.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Scenic; can be developed as an eco-tourism site.</li></ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Large catchment; stone embankments; contributes to recharge.</li></ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Functional; adequate storage post-monsoon.</li>
                    <li>Poor water quality (salinity, nitrate, fluoride) limits drinking use.</li>
                </ul>
                <br/><b>Solution:</b> Water treatment units, controlled cattle washing, buffer plantation, community awareness.
            `
        };

        function renderBeerTab(mainTab) {
            const contentDiv = villageInfo.querySelector('.beer-section-content');
            const imgs = mainTab === 'well' ? wellImages : (mainTab === 'bawdi' ? bawdiImages : phoolImages);
            const tabData = mainTab === 'well' ? wellTabData : (mainTab === 'bawdi' ? bawdiTabData : phoolTabData);
            contentDiv.innerHTML = `
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
            `;
            // Insert images
            const imageRow = contentDiv.querySelector('.ratangarh-image-row');
            imgs.forEach((img, i) => {
                const box = document.createElement('div');
                box.className = 'ratangarh-img-box';
                box.innerHTML = `<img src='${img.src}' alt='Beer Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                if (img.viewAll) {
                    const btn = document.createElement('a');
                    btn.href = 'beer.html';
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
        let currentMainTab = 'well';
        renderBeerTab(currentMainTab);
        villageInfo.querySelectorAll('.beer-main-tab').forEach(btn => {
            btn.onclick = () => {
                villageInfo.querySelectorAll('.beer-main-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMainTab = btn.getAttribute('data-main-tab');
                renderBeerTab(currentMainTab);
            };
        });
    }, 0);
}
// ... existing code ...    

else if (village.id === 'banseli') {
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
            {src: 'images/Banseli/1.jpg', caption: 'Banseli Talab – large rectangular pond'},
            {src: 'images/Banseli/2.jpg', caption: 'Ancient Bawdi near settlement'},
            {src: 'images/Banseli/3.jpg', caption: 'Seasonal storage; heritage in decline', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Banseli Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'banseli.html';
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
                    <tr><th>Location</th><td>Banseli Village, Ajmer District</td></tr>
                    <tr><th>Latitude</th><td>26.517267</td></tr>
                    <tr><th>Longitude</th><td>74.552184</td></tr>
                </table>
                Banseli village contains two major traditional water structures: a large rectangular talab and an ancient bawdi near the settlement. Historically, these provided irrigation, cattle water, and domestic supply. Today, the talab holds seasonal water but is polluted with plastic and silt; the bawdi is partially collapsed. These represent not just functional water bodies, but also symbols of community cooperation and traditional engineering.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                <ul>
                    <li>Talab is nearly 500 years old.</li>
                    <li>Bawdi dates to the Rajput–Mughal period.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Talab — cattle use, occasional irrigation.</li>
                    <li>Bawdi — abandoned.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                Local fairs and rituals historically linked to the talab.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Good — if restored, can attract heritage enthusiasts.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Talab supports groundwater recharge.</li>
                    <li>Stepwell ensures perennial access historically by reducing evaporation.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Talab polluted (plastic, silt); seasonal water.</li>
                    <li>Bawdi partially collapsed/neglected.</li>
                </ul>
                <br/><b>Solution:</b> Revival through MGNREGA, eco-restoration, fencing, and linking to tourism/heritage walks.
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

else if (village.id === 'bhinmal') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="bhinmal-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
            <button class="bhinmal-main-tab active" data-main-tab="brahm">Brahmkund</button>
            <button class="bhinmal-main-tab" data-main-tab="obalwa">Obalwa Bera</button>
            <button class="bhinmal-main-tab" data-main-tab="talbi">Talbi Talab</button>
            <button class="bhinmal-main-tab" data-main-tab="wasari">Wasari Mata Mandir & Sukri River</button>
        </div>
        <div class="bhinmal-section-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Images for sections (using available folder images)
        const brahmImages = [
            {src: 'images/Bhinmal/1.jpg', caption: 'Brahmkund – ancient stepwell beside Chandeshwar Mahadev'},
            {src: 'images/Bhinmal/2.jpg', caption: 'Medieval stepwell geometry and depth'},
            {src: 'images/Bhinmal/3.jpg', caption: 'Siltation and urban pressure visible', viewAll: true}
        ];
        const obalwaImages = [
            {src: 'images/Bhinmal/2.jpg', caption: 'Obalwa Bera – historic reservoir'},
            {src: 'images/Bhinmal/3.jpg', caption: 'Encroachment and siltation issues'},
            {src: 'images/Bhinmal/4.jpg', caption: 'Potential for eco-heritage revival', viewAll: true}
        ];
        const talbiImages = [
            {src: 'images/Bhinmal/3.jpg', caption: 'Talbi Talab (Triyambh Mansarovar) – sacred waterbody'},
            {src: 'images/Bhinmal/1.jpg', caption: 'Temple adjacency and catchment layout'},
            {src: 'images/Bhinmal/4.jpg', caption: 'Neglect and drying concerns', viewAll: true}
        ];
        const wasariImages = [
            {src: 'images/Bhinmal/4.jpg', caption: 'Wasari Mata Mandir – spiritual hub'},
            {src: 'images/Bhinmal/3.jpg', caption: 'Sukri River (seasonal) near temple precinct'},
            {src: 'images/Bhinmal/2.jpg', caption: 'Temple–river ecology context', viewAll: true}
        ];

        // Tab contents for each main section
        const brahmTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Brahmkund (Arikup/Chandeshwar Kund), Bhinmal</td></tr>
                    <tr><th>Latitude</th><td>25.002867</td></tr>
                    <tr><th>Longitude</th><td>72.267944</td></tr>
                </table>
                Brahmkund is an ancient stepwell believed to be over 1000 years old, near Chandeshwar Mahadev temple. Built with local sandstone, its deep, symmetric steps ensured access even during droughts.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                Constructed during the medieval Rajput period, the stepwell reflects Rajasthan’s traditional water architecture and community water wisdom.
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Rarely used; mostly ritual/occasional baths.</li><li>Storage reduced due to siltation and urban pressure.</li></ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                Beside Chandeshwar Mahadev; considered purifying to bathe before prayers; rituals especially around Shivratri.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>High for heritage+religious tourism with restoration.</li><li>Depth (~21 m) and temple proximity suit cultural trails.</li></ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Medieval stepwell engineering; groundwater recharge; drought-resilient access.</li></ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Siltation, encroachments, drying; reduced prominence.</li></ul>
            `
        };

        const obalwaTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Obalwa Bera, Bhinmal</td></tr>
                    <tr><th>Latitude</th><td>25.002867</td></tr>
                    <tr><th>Longitude</th><td>72.267944</td></tr>
                </table>
                A centuries-old reservoir (likely >1000 years) built for sustainable storage in an arid zone; once central to agriculture and drinking water.
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Constructed by local rulers; multi-use bera typical to desert hydrology.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Limited; occasional livestock support.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Linked with community gatherings and local traditions.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Good if revived—eco/heritage trail inclusion.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Stone reservoir; runoff capture; groundwater recharge.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Highly silted, partially polluted, encroached; capacity reduced.</li></ul>`
        };

        const talbiTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Talbi Talab (Triyambh Mansarovar), Bhinmal</td></tr>
                    <tr><th>Latitude</th><td>25.002867</td></tr>
                    <tr><th>Longitude</th><td>72.267944</td></tr>
                </table>
                A 300–400 year-old sacred talab near Triyambh Mahadev temple; modeled after Mansarovar Lake; used during religious festivals.
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Temple-linked sacred waterbody with historic hydrological design.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Festival use; some livestock watering.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Purificatory bathing before temple prayers; fairs/events.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>High—pilgrimage tourism if restored.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Large catchment-based rainwater storage; prolonged retention.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Neglected, polluted, drying; siltation and urban damage.</li></ul>`
        };

        const wasariTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Wasari Mata Mandir & Sukri River, Bhinmal</td></tr>
                    <tr><th>Latitude</th><td>25.002867</td></tr>
                    <tr><th>Longitude</th><td>72.267944</td></tr>
                </table>
                A ~1300-year-old temple by the seasonal Sukri River (Luni tributary); a historic temple–river ecology that sustained settlements and rituals.
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Temple–river relationship supported rituals, agriculture, and settlement patterns.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Temple active with peak Navratri footfall; river mostly dry.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Among the most sacred sites; pilgrims bathed in Sukri before entering shrine.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Immense—eco-spiritual hub if river rejuvenated.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Temple–river ecology; sacred geography integrated with water management.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Temple well maintained; river shrinking due to rainfall decline and degradation.</li></ul>`
        };

        function renderBhinmalTab(mainTab) {
            const contentDiv = villageInfo.querySelector('.bhinmal-section-content');
            const imgs = mainTab === 'brahm' ? brahmImages : mainTab === 'obalwa' ? obalwaImages : mainTab === 'talbi' ? talbiImages : wasariImages;
            const tabData = mainTab === 'brahm' ? brahmTabData : mainTab === 'obalwa' ? obalwaTabData : mainTab === 'talbi' ? talbiTabData : wasariTabData;
            contentDiv.innerHTML = `
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
            `;
            // Insert images
            const imageRow = contentDiv.querySelector('.ratangarh-image-row');
            imgs.forEach((img, i) => {
                const box = document.createElement('div');
                box.className = 'ratangarh-img-box';
                box.innerHTML = `<img src='${img.src}' alt='Bhinmal Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                if (img.viewAll) {
                    const btn = document.createElement('a');
                    btn.href = 'bhinmal.html';
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
        let currentMainTab = 'brahm';
        renderBhinmalTab(currentMainTab);
        villageInfo.querySelectorAll('.bhinmal-main-tab').forEach(btn => {
            btn.onclick = () => {
                villageInfo.querySelectorAll('.bhinmal-main-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMainTab = btn.getAttribute('data-main-tab');
                renderBhinmalTab(currentMainTab);
            };
        });
    }, 0);
}
// ... existing code ...    

else if (village.id === 'delwara') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="delwara-main-tabs" style="display:flex;gap:12px;margin-bottom:18px;">
            <button class="delwara-main-tab active" data-main-tab="palera">Palera Talab</button>
            <button class="delwara-main-tab" data-main-tab="indra">Indra Kund</button>
        </div>
        <div class="delwara-section-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        // Images for Delwara
        const paleraImages = [
            {src: 'images/Delwara/1.jpg', caption: 'Palera Talab – heritage reservoir (1875 CE)'},
            {src: 'images/Delwara/2.jpg', caption: 'Chhatris, steps and embankment architecture'},
            {src: 'images/Delwara/3.jpg', caption: 'Tourism circuit potential near Devigarh', viewAll: true}
        ];
        const indraImages = [
            {src: 'images/Delwara/2.jpg', caption: 'Indra Kund – Rajput-era stepwell (1856 CE)'},
            {src: 'images/Delwara/1.jpg', caption: 'Restored stepwell showcasing carvings'},
            {src: 'images/Delwara/3.jpg', caption: 'Community space and cultural site', viewAll: true}
        ];

        // Tab data for Palera Talab
        const paleraTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Palera Talab, Delwara</td></tr>
                    <tr><th>District</th><td>Jalore</td></tr>
                    <tr><th>Latitude</th><td>24.774509</td></tr>
                    <tr><th>Longitude</th><td>73.747508</td></tr>
                </table>
                Built in 1875 CE by Queen Sajjan Kumari in memory of Prince Jhala Mansinghji, Palera Talab was Delwara’s principal water source and remains a remarkable heritage reservoir.<br/><br/>
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Constructed in 1875 CE by Queen Sajjan Kumari; key source for Delwara village in the late 19th century.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Now a heritage landmark; occasional community gatherings.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Surrounded by temples (Vaikunth Nathji, Indra Kund, Jain temples); integrated with local rituals.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Very high—near RAAS Devigarh Palace and Jain temples; ideal for heritage circuits.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>19th-century water storage design with chhatris, steps, and rainwater management.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Relatively preserved; needs ongoing maintenance to prevent siltation/encroachment.</li></ul>`
        };

        // Tab data for Indra Kund
        const indraTabData = {
            overview: `
                <b style='color:#2a5d9f;'>Overview</b><br/>
                <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                    <tr><th>Location</th><td>Indra Kund, Delwara</td></tr>
                    <tr><th>District</th><td>Jalore</td></tr>
                    <tr><th>Latitude</th><td>24.774509</td></tr>
                    <tr><th>Longitude</th><td>73.747508</td></tr>
                </table>
                Constructed in 1856 CE by Raj Rana Bairisalji, Indra Kund is a Rajput-era stepwell restored in recent years through collaborative efforts; now a vibrant heritage space.<br/><br/>
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Built in 1856 CE; showcases classical stepwell architecture and royal patronage.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Community space; heritage site; limited ritual water use.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Close to local temples; retains role in small-scale religious events.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Extremely high—carvings, architecture, proximity to Devigarh Palace.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Historic Persian wheel system; stepwell geometry enabling recharge.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Well maintained after restoration; model of public–private heritage revival.</li></ul>`
        };

        function renderDelwaraTab(mainTab) {
            const contentDiv = villageInfo.querySelector('.delwara-section-content');
            const imgs = mainTab === 'palera' ? paleraImages : indraImages;
            const tabData = mainTab === 'palera' ? paleraTabData : indraTabData;
            contentDiv.innerHTML = `
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
            `;
            // Insert images
            const imageRow = contentDiv.querySelector('.ratangarh-image-row');
            imgs.forEach((img, i) => {
                const box = document.createElement('div');
                box.className = 'ratangarh-img-box';
                box.innerHTML = `<img src='${img.src}' alt='Delwara Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
                if (img.viewAll) {
                    const btn = document.createElement('a');
                    btn.href = 'delwara.html';
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
        let currentMainTab = 'palera';
        renderDelwaraTab(currentMainTab);
        villageInfo.querySelectorAll('.delwara-main-tab').forEach(btn => {
            btn.onclick = () => {
                villageInfo.querySelectorAll('.delwara-main-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMainTab = btn.getAttribute('data-main-tab');
                renderDelwaraTab(currentMainTab);
            };
        });
    }, 0);
}
// ... existing code ...    

else if (village.id === 'bharoori') {
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
        // Insert images
        const images = [
            {src: 'images/Bharoori/1.jpg', caption: 'Ancient Well – Bharoo ri Village'}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Bharoori Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'bharoori.html';
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
                    <tr><th>Location</th><td>Ancient Well, Bharoori Village (Bhinmal)</td></tr>
                    <tr><th>District</th><td>Jalore</td></tr>
                    <tr><th>Latitude</th><td>25.190709</td></tr>
                    <tr><th>Longitude</th><td>72.993743</td></tr>
                </table>
                This stone masonry well, built centuries ago, once sustained the entire village of Bharoori. It represents the rural tradition of communal wells.<br/><br/>
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Centuries-old communal well serving Bharoori’s households; a key village asset before modern pipelines.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Currently unused for drinking due to contamination; could be revived for irrigation.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Not directly ritual-linked, but preserved in local memory and identity.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Low; can serve as a heritage example if cleaned and conserved.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Pulley + stone ring construction reflecting low-cost, sustainable storage.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Neglected; surrounded by garbage and weeds; indicates heritage loss.</li></ul>`
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

else if (village.id === 'mandal') {
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
        // Insert images
        const images = [
            {src: 'images/Mandal/1.jpg', caption: 'Mandal Pond – heritage waterbody'},
            {src: 'images/Mandal/2.jpg', caption: 'Traditional catchment-based pond'},
            {src: 'images/Mandal/3.jpg', caption: 'Current state – partial siltation', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Mandal Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'mandal.html';
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
                    <tr><th>Location</th><td>Mandal Pond, Bhilwara</td></tr>
                    <tr><th>Latitude</th><td>25.441607</td></tr>
                    <tr><th>Longitude</th><td>74.571011</td></tr>
                </table>
                Located just 2.8 km from Mandal railway station, Mandal Pond is a historic water body linked to Mughal-era military camps. Earlier it served as a drinking water source, cattle spot, and community hub. With time, it lost importance but remains a peaceful heritage site valued by locals. The pond reflects Rajasthan’s tradition of integrating water with culture and settlement history.<br/><br/>
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Mughal-era linked pond serving settlements and military camps historically.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Irrigation, cattle, recreation.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>Used in local fairs and rituals.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Heritage tourism potential.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Traditional catchment pond.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Partial siltation; neglected.</li><li><b>Solutions:</b> Heritage-linked eco-tourism, cleaning, desilting.</li></ul>`
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

else if (village.id === 'meja') {
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
        // Insert images
        const images = [
            {src: 'images/Meja/1.jpg', caption: 'Meja Dam – modern reservoir'},
            {src: 'images/Meja/3.jpg', caption: 'Spillways and engineered embankments'},
            {src: 'images/Meja/2.png', caption: 'Functional storage; fisheries and pipelines', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Meja Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'meja.html';
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
                    <tr><th>Location</th><td>Meja Dam, Bhilwara</td></tr>
                    <tr><th>Latitude</th><td>25.393323</td></tr>
                    <tr><th>Longitude</th><td>74.540524</td></tr>
                </table>
                Meja Dam is one of the most important modern reservoirs in Bhilwara, supplying drinking and irrigation water to Mandal and nearby regions. With spillways, sluice gates, and engineered embankments, it provides year-round water security and reduces dependence on traditional sources. Siltation and rising demand remain challenges; watershed management can ensure long-term reliability.<br/><br/>
            `,
            history: `<b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>Modern dam built for irrigation and drinking water supply.`,
            uses: `<b style='color:#2a5d9f;'>💧 Current Uses</b><ul><li>Pipeline supply, irrigation, fisheries.</li></ul>`,
            religion: `<b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>No direct ritual significance; culturally valued by locals.`,
            tourism: `<b style='color:#2a5d9f;'>🧭 Tourism Potential</b><ul><li>Boating and eco-tourism scope.</li></ul>`,
            science: `<b style='color:#2a5d9f;'>🔬 Scientific Novelty</b><ul><li>Engineered spillways and storage system.</li></ul>`,
            condition: `<b style='color:#2a5d9f;'>📊 Current Condition</b><ul><li>Functional but facing siltation.</li><li><b>Solutions:</b> Watershed management, dam safety checks, controlled use.</li></ul>`
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

else if (village.id === 'keerkhera') {
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
            {src: 'images/Keerkhera/1.jpg', caption: 'Keerkhara Pond – traditional community waterbody'},
            {src: 'images/Keerkhera/2.jpg', caption: 'Earthen embankments and catchment layout'},
            {src: 'images/Keerkhera/3.jpg', caption: 'Drought-affected; low storage today', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Keerkhara Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'keerkhera.html';
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
                    <tr><th>Location</th><td>Keerkhara Pond, Bhilwara</td></tr>
                    <tr><th>Latitude</th><td>25.421150</td></tr>
                    <tr><th>Longitude</th><td>74.566471</td></tr>
                </table>
                Keerkhara Pond once spread over 5–6 bighas, serving irrigation, livestock, and community needs. Today, recurrent droughts and climate variability have reduced its capacity, but it remains part of the village identity and supports livestock watering.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of the Waterbody</b><br/>
                Community pond of centuries-old origin, central to rural livelihoods.
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Livestock water support.</li>
                    <li>Minimal irrigation during good rains.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                Historically used in village rituals and gatherings.
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Low unless revived as an eco-park with trails.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Earthen embankments to capture monsoon runoff.</li>
                    <li>Supports groundwater recharge.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Drought-affected; blocked catchments; silted bed.</li>
                    <li><b>Solutions:</b> Check dams upstream, recharge wells, watershed treatment, plantation, desilting.</li>
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

else if (village.id === 'ramderiya') {
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
            {src: 'images/Ramderiya/1.jpg', caption: 'Gawiya Kuaan - traditional well'},
            {src: 'images/Ramderiya/2.jpg', caption: 'Rectangular well structure with marble lining'},
            {src: 'images/Ramderiya/3.jpg', caption: 'Stone trenches and heritage architecture', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Ramderiya Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'ramderiya.html';
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
                    <tr><th>Location</th><td>Ramderiya, Barmer District</td></tr>
                    <tr><th>Latitude</th><td>25.9000</td></tr>
                    <tr><th>Longitude</th><td>71.6000</td></tr>
                </table>
                Ramderiya is home to the historic Gawiya Kuaan, a unique rectangular well that is 200-300 years old. This traditional water structure showcases exceptional architectural design with marble lining and stone trenches, representing the region's hydraulic heritage.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>The Ramderiya Gawiya Kuaan is a traditional well that is estimated to be 200–300 years old, making it a significant part of the region's hydraulic heritage.</li>
                    <li>Unlike most circular wells in Rajasthan, this one is rectangular, approximately 30–40 feet deep and 1–2 meters wide.</li>
                    <li>It was historically the primary water source for both drinking and irrigation, showcasing local adaptation to arid conditions through stone-lined channels and marble construction.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Today, the well is rarely used, primarily due to hard water and high fluoride content, which can harm human health.</li>
                    <li>Villagers now depend on Indira Gandhi Canal, Jal Jeevan Mission taps, and RO (Reverse Osmosis) systems for safe drinking water.</li>
                    <li>The well may still serve minor irrigation or livestock use, but it's no longer the main water source.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>While no specific rituals are mentioned, traditional wells in Rajasthan are often viewed with cultural reverence.</li>
                    <li>Given its age and marble structure, the Gawiya Kuaan likely holds spiritual or symbolic value in the local community.</li>
                    <li>Such water bodies are often connected to ancestral memory and rituals, especially during festivals or seasonal prayers for rain.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>The Gawiya Kuaan's unique rectangular structure, stone trenches, and marble lining give it strong architectural and heritage appeal.</li>
                    <li>As one of the few surviving centuries-old functional water structures, it could attract heritage tourists, researchers, and rural tourism groups.</li>
                    <li>With minimal restoration and information signage, it can become part of a water heritage trail in Barmer.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The rectangular design is rare among traditional wells in Rajasthan, which are typically circular for structural integrity.</li>
                    <li>The use of marble for lining indicates advanced material usage and aesthetic consideration in traditional water architecture.</li>
                    <li>This well demonstrates traditional multi-purpose water infrastructure, offering insights into early hydro-engineering, water flow management via trenches, and groundwater access in arid regions.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Structurally, the well remains intact and visually impressive, but its water quality is poor due to fluoride contamination and hardness of water.</li>
                    <li>It has been largely abandoned for regular use in favor of modern piped water systems.</li>
                    <li>Despite being out of active service, the well is a remarkable symbol of traditional ingenuity and could be preserved as a heritage structure with proper documentation and care.</li>
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

else if (village.id === 'badabagh') {
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
            {src: 'images/Badabagh/1.jpg', caption: 'Khitpal Nadi - traditional waterbody'},
            {src: 'images/Badabagh/2.jpg', caption: 'Desert wells and water heritage'},
            {src: 'images/Badabagh/3.jpg', caption: 'Royal cenotaphs and desert landscape', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Badabagh Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'badabagh.html';
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
                    <tr><th>Location</th><td>Badabagh, Jaisalmer District</td></tr>
                    <tr><th>Latitude</th><td>26.9000</td></tr>
                    <tr><th>Longitude</th><td>70.9000</td></tr>
                </table>
                Badabagh is a historically significant desert area in Jaisalmer, known for its royal cenotaphs and traditional water systems. The region features Khitpal Nadi and traditional wells that have sustained desert life for generations, though they now face challenges from climate change and neglect.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Badabagh, a historically significant desert area in Jaisalmer, has long depended on traditional water sources like wells and Nadis (seasonal rain-fed ponds).</li>
                    <li>Among these, Khitpal Nadi was a major water body, crucial for both local communities and their livestock.</li>
                    <li>These systems were based on rainwater harvesting and low-maintenance structures, which sustained desert life for generations.</li>
                    <li>Over time, neglect, urbanization, and climate change have led to the decline of these traditional systems, with Khitpal Nadi now drying up.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Well water in Badabagh is still used for drinking and irrigation, though manual extraction is physically exhausting and many wells have dried up due to falling groundwater levels.</li>
                    <li>Locals increasingly depend on water tankers supplying water from submersible pumps.</li>
                    <li>The Khitpal Nadi, though polluted and neglected, is still used by cattle for drinking, reflecting its lingering importance despite its degraded state.</li>
                    <li>Despite challenges, drinking water quality is reported to be good by locals for now.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>While specific religious rituals weren't detailed, traditional water bodies like Khitpal Nadi often hold spiritual and cultural value in Rajasthani villages.</li>
                    <li>These water bodies are typically integrated into festivals, ancestral worship, and community gatherings, reflecting respect for nature and water as sacred elements.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Badabagh already attracts tourists for its royal cenotaphs and desert landscapes.</li>
                    <li>Reviving Khitpal Nadi and other water bodies could enhance eco-tourism appeal, offering insight into desert survival techniques, traditional water harvesting systems, and community-driven sustainability efforts.</li>
                    <li>A cleaned and restored Khitpal Nadi could serve as a heritage spot, showcasing ancient desert water wisdom.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The case of Badabagh highlights the evaporation challenge of surface water in extreme heat and the unsustainable dependence on tanker water and deep borewells.</li>
                    <li>Traditional methods like rainwater harvesting via Nadis and wells are being re-examined for revival.</li>
                    <li>Restoration efforts could serve as a case study for desert hydrology, contribute to climate-resilient infrastructure, and encourage low-cost, decentralized water systems in arid zones.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Khitpal Nadi is in a state of disrepair, with drying water levels, pollution and waste accumulation, and water unfit for human use, though cattle still rely on it.</li>
                    <li>Hundreds of wells have dried up, worsening the situation.</li>
                    <li>There is an urgent need for revival, de-silting, pollution removal, and sustainable planning.</li>
                    <li>Despite the scarcity, the existing water sources are currently safe for drinking, but future availability is under threat.</li>
                    <li>Community dependence on water tankers and submersibles shows that the situation is unsustainable without intervention.</li>
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

else if (village.id === 'mokla') {
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
            {src: 'images/Mokla/1.jpg', caption: 'Traditional Talab in Mokla'},
            {src: 'images/Mokla/2.jpg', caption: 'Stambh memorial pillar'},
            {src: 'images/Mokla/3.jpg', caption: 'Community water conservation', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Mokla Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'mokla.html';
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
                    <tr><th>Location</th><td>Mokla, Jaisalmer District</td></tr>
                    <tr><th>Latitude</th><td>25.9500</td></tr>
                    <tr><th>Longitude</th><td>71.7000</td></tr>
                </table>
                Mokla is a desert village with a rich tradition of water conservation, featuring Nadis, Beris, Talabs, and a commemorative Stambh. The community is actively reviving traditional water systems with NGO support, making it a model for sustainable desert water management.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Mokla has a long history of traditional water conservation, rooted in its arid desert geography.</li>
                    <li>Key water bodies like Nadis (seasonal ponds), Beris (small wells or stepwells), and Talabs (large ponds) have been the lifelines of the community for generations.</li>
                    <li>A Stambh (memorial pillar) in the village commemorates the ancestral efforts in water harvesting, symbolizing the community's collective memory and respect for sustainable water wisdom.</li>
                    <li>One major Talab, historically used by the Oran community and entire village, remains in use and is now undergoing community-led expansion to boost rainwater storage.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>The only functional Talab in Mokla continues to provide drinking water and support daily needs for the entire village.</li>
                    <li>Nadis and Beris, though mostly dried up, are being revived for future use with community and NGO support.</li>
                    <li>Due to water scarcity and deep groundwater, villagers also depend on submersible pump systems and water tankers, especially during extreme summers.</li>
                    <li>These secondary sources are less sustainable but necessary under current conditions.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>The Stambh marking the historical water structures carries spiritual and cultural importance, acting as a memorial of community resilience and reverence toward water.</li>
                    <li>Water conservation in Mokla is seen not just as a survival strategy but as a cultural duty, closely tied to ancestral legacy and community pride.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Mokla holds strong rural and heritage tourism potential: the Stambh symbolizing water wisdom, ongoing community revival projects, and involvement of notable water activist movements like Tarun Bharat Sangh.</li>
                    <li>With proper support, Mokla could become a model village for sustainable water practices, community-led environmental management, and cultural tourism focused on desert resilience.</li>
                    <li>Visitors interested in eco-tourism or Gandhian water conservation models may find it highly educational and impactful.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Mokla's water system reflects a blended model: traditional rainwater harvesting structures (Nadi, Talab, Beri) supplemented by modern mechanical systems (submersible pumps, water tankers).</li>
                    <li>The revival of Nadis and Talabs showcases cost-effective, community-driven conservation with high impact in drought-prone areas.</li>
                    <li>Supported by organizations like Tarun Bharat Sangh (TBS), Mokla represents a living lab of desert hydrology and grassroots environmental engineering.</li>
                    <li>The village highlights challenges in government delivery vs. NGO action, useful for policy and governance studies.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Only one Talab remains operational, which is under expansion.</li>
                    <li>Most other traditional sources (Nadis and Beris) have dried up or fallen into disrepair.</li>
                    <li>Revival efforts include ₹5 lakhs raised by villagers, ₹15 lakhs funded by Tarun Bharat Sangh, and technical collaboration with MGF India.</li>
                    <li>Government schemes, according to villagers, exist only on paper—with little to no actual impact seen on the ground.</li>
                    <li>The situation remains precarious but hopeful, thanks to strong community involvement, Oran leader Kundan Singh, and NGO partnerships.</li>
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
else if (village.id === 'pokhran') {
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
            {src: 'images/Pokhran/1.jpg', caption: 'Ramdevra-Kund sacred water body'},
            {src: 'images/Pokhran/2.jpg', caption: 'Traditional Tankas and Kunds'},
            {src: 'images/Pokhran/3.jpg', caption: 'Desert water heritage', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Pokhran Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'pokhran.html';
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
                    <tr><th>Location</th><td>Ramdevra(Pokhran Tehsil), Jaisalmer District</td></tr>
                    <tr><th>Latitude</th><td>27.1000</td></tr>
                    <tr><th>Longitude</th><td>71.5000</td></tr>
                </table>
                Pokhran is a historically significant town in the Thar Desert, known for its traditional water harvesting systems including Tankas, Kunds, and Johads. The sacred Ramdevra-Kund near the revered Ramdev Pir Temple continues to serve as a spiritual water source for pilgrims.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Ramdevra, a historically significant village in the Thar Desert, has long relied on traditional water harvesting systems such as Tankas (underground water tanks), Kunds (domed reservoirs), and Johads (small earthen check dams).</li>
                    <li>These systems once formed the lifeline of desert survival, storing rainwater for domestic and religious use.</li>
                    <li>The Ramdevra-Kund, near the revered Ramdev Pir Temple, is a historically sacred water body where pilgrims performed ritualistic dips for centuries.</li>
                    <li>Over time, neglect, low rainfall, and urbanization have led to drying up or underuse of these systems.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Today, many tankas, kunds, and johads in Ramdevra are dried up or in disrepair, with residents primarily depending on piped water supply and occasional restored water bodies.</li>
                    <li>The Ramdevra-Kund continues to be used for ritualistic bathing by pilgrims during specific religious events.</li>
                    <li>Some revived structures under MNREGA (rural employment scheme) are beginning to restore traditional functionality.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Ramdevra-Kund is a sacred site for devotees of Baba Ramdev Pir, a revered local deity worshipped across Rajasthan and Gujarat.</li>
                    <li>Pilgrims believe a ritual dip in the kund grants spiritual blessings, healing, and fulfillment of wishes.</li>
                    <li>Despite challenges with water level and cleanliness, the devotional use of this kund continues, supported by temple authorities and locals.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Ramdevra is already a major pilgrimage destination, attracting thousands during annual Ramdevra Mela.</li>
                    <li>Reviving and beautifying Ramdevra-Kund and nearby traditional water bodies can enhance the spiritual and heritage tourism experience, educate visitors about ancient water conservation systems, and support eco-tourism initiatives in the desert landscape.</li>
                    <li>Such restoration would add cultural and environmental value to the Pokhran area.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>The Ramdevra water systems showcase centuries-old engineering optimized for desert ecology: Tankas and Kunds efficiently collect and store rainwater, while Johads facilitate groundwater recharge.</li>
                    <li>These are now being reintegrated through MNREGA, indicating a blending of traditional wisdom with modern development.</li>
                    <li>Their revival presents a replicable model for other drought-prone regions in India and beyond.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Most traditional water bodies in Ramdevra are dried up or underutilized, primarily due to low rainfall, shift to piped water supply, and lack of consistent maintenance.</li>
                    <li>Revival work is ongoing through MNREGA, but progress varies.</li>
                    <li>Ramdevra-Kund, although affected by water shortage, is still cared for by the temple and remains a functioning spiritual water source.</li>
                    <li>The area urgently needs regular desilting, structural repairs, and community involvement and monitoring.</li>
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
            {src: 'images/Rajasmand/1.jpg', caption: 'Rajsamand Lake - largest artificial lake'},
            {src: 'images/Rajasmand/2.jpg', caption: 'Raj Prashasti inscription on marble'},
            {src: 'images/Rajasmand/3.jpg', caption: 'Marble embankments and pavilions', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Rajsamand Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'rajasmand.html';
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
                    <tr><th>Location</th><td>Rajsamand, Rajsamand District</td></tr>
                    <tr><th>Latitude</th><td>25.0667</td></tr>
                    <tr><th>Longitude</th><td>73.8833</td></tr>
                </table>
                Rajsamand Lake is one of the largest artificial lakes in Rajasthan, built in 1662 AD by Maharana Raj Singh I of Mewar. This magnificent water body features the famous Raj Prashasti inscription and serves as a vital source for drinking water, irrigation, and tourism in the region.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Rajsamand Lake is one of the largest artificial lakes in Rajasthan, built in 1662 AD by Maharana Raj Singh I of Mewar. The lake was constructed across the Gomati, Kelwa, and Tali rivers to combat droughts and provide water for agriculture, drinking, and daily use in the Mewar region.</li>
                    <li>An important historical feature is the Raj Prashasti, the longest stone inscription in India, engraved on marble slabs along the dam embankment. It records the history and achievements of Mewar rulers and reflects the cultural richness of the era.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>Drinking Water: The lake continues to supply potable water to nearby towns and villages.</li>
                    <li>Irrigation: It supports farming and agriculture by providing irrigation water.</li>
                    <li>Tourism & Recreation: Locals and tourists visit for boating, picnics, and leisure walks.</li>
                    <li>Fisheries: Fishing is practiced in a regulated manner, supporting local livelihoods.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>Rajsamand Lake is considered spiritually important, especially during festivals like Gangaur and Kartik Purnima. The lakefront has temples and ghats (bathing steps), where rituals, aartis, and religious processions take place.</li>
                    <li>Many locals perform ancestral rituals and holy dips here.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>Scenic Spot: Surrounded by hills and palaces, it's a tranquil escape for tourists and nature lovers.</li>
                    <li>Historical Attraction: Visitors come to see Raj Prashasti, the dam (Nauchowki), and the marble embankments.</li>
                    <li>Cultural Tourism: Festivals and fairs at the lake draw large crowds.</li>
                    <li>Photography & Boating: A popular spot for sunset photography, birdwatching, and boat rides.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Massive Embankment: Built using white marble, the lake is bordered by nine pavilions (nauchowki) with beautiful carvings.</li>
                    <li>Hydraulic Engineering: Diverts and stores river water, prevents flood damage, and maintains groundwater levels.</li>
                    <li>Early Water Management: Represents 17th-century water sustainability efforts, showing foresight in managing water in arid zones.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>Water Quantity: Well-maintained with a large storage capacity. The lake fills up during monsoons and sustains year-round.</li>
                    <li>Water Quality: Generally good, but prone to pollution from urban runoff or human activity during festivals.</li>
                    <li>Conservation Efforts: Ongoing government and community efforts aim to clean, preserve, and beautify the lake for tourism and heritage protection.</li>
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
else if (village.id === 'gajsar') {
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
            {src: 'images/Gajsar/1.jpg', caption: 'Historic well and collecting tank'},
            {src: 'images/Gajsar/2.jpg', caption: 'Dome-shaped kundi (underground tank)'},
            {src: 'images/Gajsar/3.jpg', caption: 'Khara Pani Aquaculture Lab', viewAll: true}
        ];
        const imageRow = villageInfo.querySelector('.ratangarh-image-row');
        images.forEach((img, i) => {
            const box = document.createElement('div');
            box.className = 'ratangarh-img-box';
            box.innerHTML = `<img src='${img.src}' alt='Gajsar Image ${i+1}'><div class='ratangarh-img-caption'>${img.caption}</div>`;
            if (img.viewAll) {
                const btn = document.createElement('a');
                btn.href = 'gajsar.html';
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
                    <tr><th>Location</th><td>Gajsar, Jaisalmer District</td></tr>
                    <tr><th>Latitude</th><td>26.8000</td></tr>
                    <tr><th>Longitude</th><td>70.8000</td></tr>
                </table>
                Gajsar village holds a rich legacy of traditional water systems including a historic well, collecting tank, and dome-shaped kundi. The village is also home to innovative modern infrastructure like the Khara Pani Aquaculture Prayogshala, blending traditional wisdom with scientific adaptation to desert challenges.<br/><br/>
            `,
            history: `
                <b style='color:#2a5d9f;'>📜 History of Waterbody</b><br/>
                <ul>
                    <li>Gajsar village holds a rich legacy of traditional water systems, particularly a historic well and collecting tank, once a lifeline for the village, supplying water for daily use.</li>
                    <li>A dome-shaped kundi (underground water tank), historically used to harvest and store rainwater in this arid region.</li>
                    <li>These systems reflect indigenous water management knowledge that sustained desert communities for generations.</li>
                    <li>Today, they serve as symbols of Rajasthan's water heritage, though some now lie in neglect.</li>
                </ul>
            `,
            uses: `
                <b style='color:#2a5d9f;'>💧 Current Uses</b>
                <ul>
                    <li>The historic well and tank are now largely abandoned and misused as garbage dumps, with no functional utility for locals today.</li>
                    <li>The kundi, though old, still symbolizes sustainable practices and may retain occasional or symbolic use.</li>
                    <li>The region uses a Sewage Treatment Plant (STP) and GRP Outlet Drainage to treat and dispose of wastewater.</li>
                    <li>Khara Pani Aquaculture Prayogshala, which repurposes saline water for fish farming.</li>
                    <li>Despite infrastructure, the local water is saline and unpleasant, likely due to treated sewage infiltration or groundwater contamination.</li>
                </ul>
            `,
            religion: `
                <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                <ul>
                    <li>No major religious uses or spiritual associations were reported with the well, kundi, or current water infrastructure.</li>
                    <li>However, traditional water bodies in rural Rajasthan often held ceremonial or seasonal importance, even if not currently observed in Gajsar.</li>
                </ul>
            `,
            tourism: `
                <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                <ul>
                    <li>The historic kundi and well have cultural tourism potential if restored and promoted as part of heritage water architecture.</li>
                    <li>The Khara Pani Aquaculture Lab can attract academic and eco-tourism interest due to its innovative saltwater fish farming model.</li>
                    <li>Promoting sustainable water innovation and heritage conservation could make Gajsar a learning site for rural water management.</li>
                </ul>
            `,
            science: `
                <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                <ul>
                    <li>Gajsar is home to pioneering experiments in aquaculture through the Khara Pani Aquaculture Prayogshala, which uses saline water for fish farming and promotes salt-tolerant fish species as an alternative livelihood in water-scarce, saline regions.</li>
                    <li>The STP and GRP drainage system offer a complementary water treatment model, filtering pollutants and supporting reuse in agriculture.</li>
                    <li>These developments reflect scientific adaptation to desert challenges, blending traditional systems with modern innovation.</li>
                </ul>
            `,
            condition: `
                <b style='color:#2a5d9f;'>📊 Current Condition</b>
                <ul>
                    <li>The historic well and collecting tank are in a state of neglect, currently used as a waste dumping site.</li>
                    <li>Water quality in the region is highly saline, posing a major challenge for drinking and daily use.</li>
                    <li>While the STP and GRP system function, their integration with groundwater sources may be causing contamination.</li>
                    <li>The kundi remains structurally sound and symbolically valuable, though underutilized.</li>
                    <li>The RetroFlow team's field survey confirmed high salinity levels, urgent need for revival and maintenance of water infrastructure, and importance of public awareness and scientific interventions.</li>
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

else if (village.id === 'pansal') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="pansal-main-tabs">
            <button class="pansal-main-tab active" onclick="showPansalSection('bhuto')">Bhuto Ki Nadi</button>
            <button class="pansal-main-tab" onclick="showPansalSection('well')">Ancient Well</button>
            <button class="pansal-main-tab" onclick="showPansalSection('talab')">Bada Talab</button>
            <button class="pansal-main-tab" onclick="showPansalSection('bawadi')">Khari Ki Bawadi</button>
        </div>
        <div class="pansal-section-content" id="pansal-section-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        loadPansalSectionContent('bhuto');
    }, 0);
}

else if (village.id === 'atoon') {
    villageInfo.innerHTML = `
        <div class="village-header">
            <h3>${village.name}</h3>
            <span class="village-district">${this.currentDistrict ? this.currentDistrict.name : ''} District</span>
        </div>
        <div class="atoon-main-tabs">
            <button class="atoon-main-tab active" onclick="showAtoonSection('dharam')">Dharam Talai</button>
            <button class="atoon-main-tab" onclick="showAtoonSection('charbhuja')">Charbhuja Ki Bawadi</button>
        </div>
        <div class="atoon-section-content" id="atoon-section-content"></div>
        <div class="village-actions">
            <a href="${village.report}" class="view-report-btn">View Full Report</a>
            <button class="close-popup-btn" onclick="this.closest('.village-info').remove(); document.querySelector('.district-info').style.display='block';">Close</button>
        </div>
    `;
    setTimeout(() => {
        loadAtoonSectionContent('dharam');
    }, 0);
}

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

        // Remove any existing district analysis block
        const existingAnalysis = this.infoPanel.querySelector('.district-analysis');
        if (existingAnalysis) existingAnalysis.remove();

        // Add Nagaur-specific overall analysis below the village list
        if (district.id === 'nagaur') {
            const analysis = document.createElement('div');
            analysis.className = 'district-analysis';
            analysis.style.marginTop = '14px';
            analysis.innerHTML = `
                <h4 style="margin:8px 0;color:#2a5d9f;">Overall Analysis of Nagaur Water Bodies</h4>
                <b>Observations</b>
                <ul style="margin-top:6px;">
                    <li>Nagaur district shows a blend of ancient (johads, talaabs) and modern (cement tanks, culverts) systems.</li>
                    <li>Religious association (Gogaji Talab) keeps cultural memory alive.</li>
                    <li>New MGNREGA works (Barani, Alai) prove schemes are reviving heritage.</li>
                </ul>
                <b>Challenges</b>
                <ul style="margin-top:6px;">
                    <li>Dependency on monsoon → seasonal shortage.</li>
                    <li>Siltation & pollution → reduces storage & quality.</li>
                    <li>Groundwater depletion.</li>
                </ul>
                <b>Solutions</b>
                <ol style="margin-top:6px; padding-left:20px;">
                    <li>Revival & Renovation of old johads and nadis.</li>
                    <li>Community Involvement → water user committees.</li>
                    <li>Scientific Additions → soak pits, recharge wells, culverts.</li>
                    <li>Awareness Programs linking heritage, culture, and sustainability.</li>
                    <li>Tourism Linkage → promote Gogaji Talab and Adarsh Talaab as cultural eco-sites.</li>
                </ol>
                <b>Conclusion</b>
                <p style="margin-top:6px;">
                    Nagaur’s water bodies are a living testimony of Rajasthan’s desert wisdom. From ancient johads that sustained communities for centuries to modern MGNREGA-built nadis and cement tanks, they remain the lifeline of this arid region. To secure Nagaur’s future, a combined approach of reviving old heritage, maintaining modern structures, and empowering local communities is essential.
                </p>
            `;
            districtInfo.appendChild(analysis);
        }

        // Add Ajmer-specific conclusion below the village list
        if (district.id === 'ajmer') {
            const analysis = document.createElement('div');
            analysis.className = 'district-analysis';
            analysis.style.marginTop = '14px';
            analysis.innerHTML = `
                <h4 style="margin:8px 0;color:#2a5d9f;">Conclusion (Ajmer District)</h4>
                <p>Ajmer’s Beer, Bhawanta, and Banseli villages show the rich diversity of Rajasthan’s water heritage—from ancient wells and bawdis to large talabs and reservoirs. Most of these structures are now neglected or polluted, despite their historical importance and scientific brilliance. Reviving them requires:</p>
                <ul style="margin-top:6px;">
                    <li>Cleaning & Desilting under schemes like MGNREGA.</li>
                    <li>Community awareness campaigns for heritage preservation.</li>
                    <li>Integration with rainwater harvesting and recharge systems.</li>
                    <li>Tourism promotion (stepwell heritage trails, eco-tourism).</li>
                </ul>
                <p>These efforts can transform neglected ruins into functional, cultural, and ecological assets.</p>
            `;
            districtInfo.appendChild(analysis);
        }

        // Add Bhilwara-specific conclusion below the village list
        if (district.id === 'bhilwara') {
            const analysis = document.createElement('div');
            analysis.className = 'district-analysis';
            analysis.style.marginTop = '14px';
            analysis.innerHTML = `
                <h4 style="margin:8px 0;color:#2a5d9f;">Overall Conclusion – Bhilwara</h4>
                <p>Bhilwara represents a mix of ancient and modern water bodies. From 1000-year-old Bada Talab to modern Meja Dam, the district shows Rajasthan's evolution of water management. Most traditional structures still exist but are neglected due to pipelines and urbanization.</p>
                <p><strong>Solutions:</strong></p>
                <ul style="margin-top:6px;">
                    <li>Heritage revival + eco-tourism.</li>
                    <li>Watershed & catchment management.</li>
                    <li>Community ownership revival.</li>
                </ul>
            `;
            districtInfo.appendChild(analysis);
        }

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

// Pansal section functions
function showPansalSection(section) {
    // Update active tab
    document.querySelectorAll('.pansal-main-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load section content
    loadPansalSectionContent(section);
}

function loadPansalSectionContent(section) {
    const contentContainer = document.getElementById('pansal-section-content');
    
    const sectionData = {
        bhuto: {
            title: 'Bhuto Ki Nadi',
            images: [
                {src: 'images/Pansal/1.jpg', caption: 'Bhuto Ki Nadi - Small pond, 2–3 bighas'},
                {src: 'images/Pansal/2.jpg', caption: 'Community lifeline revived under MGNREGA'},
                {src: 'images/Pansal/3.jpg', caption: 'Supports local use and irrigation'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Bhuto Ki Nadi, Pansal</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Size</th><td>2–3 bighas</td></tr>
                    </table>
                    Bhuto Ki Nadi is a small community pond that has been revived under MGNREGA. It serves as a lifeline for the local community and demonstrates micro-catchment harvesting techniques.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>Small pond spanning 2–3 bighas, historically serving as a community lifeline.</li>
                        <li>Recently revived under MGNREGA scheme, showcasing government support for traditional water systems.</li>
                        <li>Represents the continuation of traditional water harvesting practices in modern times.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Revived under MGNREGA to support local community needs.</li>
                        <li>Provides water for livestock and limited irrigation.</li>
                        <li>Serves as a demonstration model for micro-catchment harvesting.</li>
                        <li>Supports local agricultural activities during monsoon season.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Small rituals are linked to the water body during local festivals.</li>
                        <li>Represents community cooperation and traditional water wisdom.</li>
                        <li>Though not directly sacred, it holds cultural value for the village.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>Limited direct tourism value due to its small size.</li>
                        <li>Could be included in educational tours about MGNREGA water projects.</li>
                        <li>Demonstrates successful revival of traditional water systems.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Demonstrates micro-catchment harvesting techniques.</li>
                        <li>Shows how traditional knowledge can be integrated with modern schemes.</li>
                        <li>Efficient use of limited space for water storage.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Successfully revived under MGNREGA.</li>
                        <li>Functional but requires regular maintenance.</li>
                        <li>Vulnerable to siltation and needs fencing for protection.</li>
                        <li>Solution: Regular maintenance, fencing, and plantation around the pond.</li>
                    </ul>
                `
            }
        },
        well: {
            title: 'Ancient Well (Near Fort)',
            images: [
                {src: 'images/Pansal/4.jpg', caption: 'Ancient Well built by King of Pansal'},
                {src: 'images/Pansal/5.jpg', caption: 'Located near fort & sacred tree'},
                {src: 'images/Pansal/6.jpg', caption: 'Heritage spot with historical significance'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Ancient Well, Pansal</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Builder</th><td>King of Pansal</td></tr>
                    </table>
                    The Ancient Well near the fort was built centuries ago by the King of Pansal. It represents the royal water infrastructure and traditional engineering of the region.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>Built by the King of Pansal centuries ago as part of royal water infrastructure.</li>
                        <li>Located strategically near the fort for easy access by the royal family and guards.</li>
                        <li>Represents the traditional water engineering of the Rajput era.</li>
                        <li>Once served as the primary drinking water source for the fort and nearby settlements.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Previously used for drinking water supply to the fort and village.</li>
                        <li>Currently used mainly for irrigation purposes.</li>
                        <li>No longer serves as primary drinking water source due to modern alternatives.</li>
                        <li>Maintains historical and cultural significance.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Located near the fort and a sacred tree, adding to its spiritual importance.</li>
                        <li>Associated with royal rituals and ceremonies of the past.</li>
                        <li>Represents the connection between water, royalty, and spirituality.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>High heritage tourism potential if properly restored.</li>
                        <li>Can be promoted as part of fort heritage tours.</li>
                        <li>Represents royal water engineering and historical significance.</li>
                        <li>Could be included in cultural heritage circuits.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Traditional well construction techniques using local materials.</li>
                        <li>Strategic placement for optimal water access and security.</li>
                        <li>Durable construction that has survived centuries.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Structurally intact but currently unused for drinking.</li>
                        <li>Requires minor restoration and maintenance.</li>
                        <li>Solution: Declare as heritage site and undertake minor restoration.</li>
                    </ul>
                `
            }
        },
        talab: {
            title: 'Bada Talab',
            images: [
                {src: 'images/Pansal/7.jpg', caption: 'Bada Talab - 1000 years old'},
                {src: 'images/Pansal/8.jpg', caption: 'Spread over 20–22 bighas'},
                {src: 'images/Pansal/9.jpg', caption: 'Large-scale community pond'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Bada Talab, Pansal</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Age</th><td>1000 years old</td></tr>
                        <tr><th>Size</th><td>20–22 bighas</td></tr>
                    </table>
                    Bada Talab is one of the oldest water bodies in the region, spanning 20–22 bighas. It represents large-scale community water management and has been maintained under MGNREGA.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>One of the oldest water bodies in the region, approximately 1000 years old.</li>
                        <li>Spans over 20–22 bighas, making it a large-scale community water project.</li>
                        <li>Represents the traditional wisdom of large-scale water harvesting.</li>
                        <li>Has sustained the community for centuries through various climatic conditions.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Primary function is groundwater recharge for the region.</li>
                        <li>Provides irrigation water for agricultural activities.</li>
                        <li>Supports livestock during dry seasons.</li>
                        <li>Maintained and functional under MGNREGA scheme.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Represents community cooperation and traditional water wisdom.</li>
                        <li>Associated with local festivals and community gatherings.</li>
                        <li>Symbolizes the sustainable relationship between humans and water.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>High heritage tourism potential due to its age and size.</li>
                        <li>Can be promoted as a heritage water body.</li>
                        <li>Represents traditional large-scale water management.</li>
                        <li>Could be included in eco-tourism circuits.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Large-scale community pond design for maximum water storage.</li>
                        <li>Traditional engineering that has survived for 1000 years.</li>
                        <li>Efficient groundwater recharge system.</li>
                        <li>Demonstrates sustainable water management practices.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Still functional and maintained under MGNREGA.</li>
                        <li>Requires protection from encroachment.</li>
                        <li>Needs committee-based maintenance for long-term sustainability.</li>
                        <li>Solution: Protection from encroachment and committee maintenance.</li>
                    </ul>
                `
            }
        },
        bawadi: {
            title: 'Khari Ki Bawadi',
            images: [
                {src: 'images/Pansal/10.jpg', caption: 'Khari Ki Bawadi - One of the oldest bawadis'},
                {src: 'images/Pansal/11.jpg', caption: 'Major source once, now abandoned'},
                {src: 'images/Pansal/12.jpg', caption: 'Stepwell style, groundwater access'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Khari Ki Bawadi, Pansal</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Type</th><td>Stepwell</td></tr>
                    </table>
                    Khari Ki Bawadi is one of the oldest stepwells in the region, once serving as a major water source. It represents traditional stepwell architecture and groundwater access techniques.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>One of the oldest bawadis (stepwells) in the region.</li>
                        <li>Once served as a major water source for the entire community.</li>
                        <li>Represents traditional stepwell architecture of Rajasthan.</li>
                        <li>Built to provide year-round access to groundwater.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Currently abandoned as a primary water source.</li>
                        <li>Used only for irrigation purposes.</li>
                        <li>No longer serves drinking water needs.</li>
                        <li>Maintains historical and architectural significance.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Represents traditional water wisdom and community cooperation.</li>
                        <li>Associated with local cultural practices and rituals.</li>
                        <li>Symbolizes the historical importance of water in desert communities.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>High heritage tourism potential due to its age and architecture.</li>
                        <li>Can be promoted as part of stepwell heritage tours.</li>
                        <li>Represents traditional Rajasthani stepwell design.</li>
                        <li>Could be included in architectural heritage circuits.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Stepwell style design for optimal groundwater access.</li>
                        <li>Traditional engineering that ensures year-round water availability.</li>
                        <li>Demonstrates sustainable groundwater management.</li>
                        <li>Shows traditional water harvesting techniques.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Deteriorated due to long-term neglect.</li>
                        <li>Structurally compromised but still standing.</li>
                        <li>Requires significant restoration work.</li>
                        <li>Solution: Partial revival as recharge bawadi.</li>
                    </ul>
                `
            }
        }
    };
    
    const currentSection = sectionData[section];
    if (!currentSection) return;
    
    // Create image carousel
    let imageHTML = `
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;">
    `;
    
    currentSection.images.forEach((img, i) => {
        imageHTML += `
            <div class="ratangarh-img-box">
                <img src='${img.src}' alt='${currentSection.title} Image ${i+1}'>
                <div class='ratangarh-img-caption'>${img.caption}</div>
            </div>
        `;
    });
    
    imageHTML += `
            </div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
    `;
    
    // Create tabs
    let tabsHTML = `
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="pansal-tab-content"></div>
    `;
    
    contentContainer.innerHTML = imageHTML + tabsHTML;
    
    // Initialize tab functionality
    const tabContent = document.getElementById('pansal-tab-content');
    const tabData = currentSection.tabs;
    
    function setTab(tab) {
        tabContent.innerHTML = tabData[tab];
        document.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
    }
    
    setTab('overview');
    document.querySelectorAll('.ratangarh-tab').forEach(btn => {
        btn.onclick = () => setTab(btn.getAttribute('data-tab'));
    });
    
    // Initialize image carousel functionality
    const imageRow = contentContainer.querySelector('.ratangarh-image-row');
    const leftArrow = contentContainer.querySelector('.ratangarh-arrow-left');
    const rightArrow = contentContainer.querySelector('.ratangarh-arrow-right');
    
    let currentIndex = 0;
    const images = currentSection.images;
    
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
    
    scrollToIndex(0);
}

// Atoon section functions
function showAtoonSection(section) {
    // Update active tab
    document.querySelectorAll('.atoon-main-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load section content
    loadAtoonSectionContent(section);
}

function loadAtoonSectionContent(section) {
    const contentContainer = document.getElementById('atoon-section-content');
    
    const sectionData = {
        dharam: {
            title: 'Dharam Talai (Ancient Pond)',
            images: [
                {src: 'images/Atoon/1.jpg', caption: 'Dharam Talai - 400–500 years old ancient pond'},
                {src: 'images/Atoon/2.jpg', caption: 'One of the oldest water bodies in Bhilwara'},
                {src: 'images/Atoon/3.jpg', caption: 'Traditional community-based water harvesting'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Dharam Talai, Atoon</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Age</th><td>400–500 years old</td></tr>
                    </table>
                    Dharam Talai is one of the oldest water bodies in Bhilwara, believed to be 400–500 years old, predating even the establishment of the nearby village. It has served as a lifeline for irrigation, drinking, and daily domestic use for centuries.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>One of the oldest water bodies in Bhilwara, believed to be 400–500 years old.</li>
                        <li>Predates the establishment of the nearby village settlement.</li>
                        <li>Has served as a lifeline for irrigation, drinking, and daily domestic use for centuries.</li>
                        <li>Represents the ancient community-based water harvesting tradition of Rajasthan.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Currently used for cattle watering and occasional irrigation.</li>
                        <li>Role has diminished with the introduction of piped water supply.</li>
                        <li>Still supports local agricultural activities during monsoon season.</li>
                        <li>Used for occasional rituals and community gatherings.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Used for rituals and is believed to bring prosperity to the community.</li>
                        <li>Religious and cultural importance has remained intact over centuries.</li>
                        <li>Associated with local festivals and community ceremonies.</li>
                        <li>Represents the spiritual connection between water and community well-being.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>Can be developed as a heritage eco-site.</li>
                        <li>High potential for heritage tourism due to its age and historical significance.</li>
                        <li>Could be included in cultural heritage circuits.</li>
                        <li>Potential for eco-tourism and educational tours.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Traditional pond design with natural catchment area.</li>
                        <li>Efficient groundwater recharge system.</li>
                        <li>Demonstrates sustainable water management practices.</li>
                        <li>Shows traditional engineering wisdom for water storage.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Heavy siltation has reduced its water storage capacity.</li>
                        <li>Seasonal drying due to reduced rainfall and maintenance.</li>
                        <li>Faces encroachment from nearby settlements.</li>
                        <li>Solution: Desilting, catchment restoration, fencing, heritage eco-park development.</li>
                    </ul>
                `
            }
        },
        charbhuja: {
            title: 'Charbhuja Ki Bawadi',
            images: [
                {src: 'images/Atoon/4.jpg', caption: 'Charbhuja Ki Bawadi - Centuries old stepwell'},
                {src: 'images/Atoon/5.jpg', caption: 'Built near Charbhuja Temple'},
                {src: 'images/Atoon/6.jpg', caption: 'Rectangular stepwell design'}
            ],
            tabs: {
                overview: `
                    <b style='color:#2a5d9f;'>Overview</b><br/>
                    <table class='ratangarh-info-table' style='width:100%;margin:18px 0 18px 0;border-collapse:collapse;'>
                        <tr><th>Location</th><td>Charbhuja Ki Bawadi, Atoon</td></tr>
                        <tr><th>District</th><td>Bhilwara</td></tr>
                        <tr><th>Type</th><td>Rectangular Stepwell</td></tr>
                        <tr><th>Size</th><td>3m × 10m</td></tr>
                    </table>
                    Charbhuja Ki Bawadi was built centuries ago near the Charbhuja Temple in Bhilwara. This rectangular stepwell was once central to the daily water needs of the community and carried religious significance.<br/><br/>
                `,
                history: `
                    <b style='color:#2a5d9f;'>📜 History</b><br/>
                    <ul>
                        <li>Built centuries ago alongside the Charbhuja Temple.</li>
                        <li>Once central to the daily water needs of the entire community.</li>
                        <li>Represents traditional stepwell architecture of Rajasthan.</li>
                        <li>Stepwells like this were not only water sources but also community gathering spaces.</li>
                    </ul>
                `,
                uses: `
                    <b style='color:#2a5d9f;'>💧 Current Uses</b>
                    <ul>
                        <li>Currently rarely used and mostly abandoned.</li>
                        <li>Practical use has diminished with the arrival of Jal Jeevan Mission pipelines.</li>
                        <li>No longer serves as primary drinking water source.</li>
                        <li>Maintains historical and architectural significance.</li>
                    </ul>
                `,
                religion: `
                    <b style='color:#2a5d9f;'>🕉 Religious Significance</b><br/>
                    <ul>
                        <li>Linked to Charbhuja deity rituals and temple ceremonies.</li>
                        <li>Water from the bawadi was used for temple rituals and pilgrim offerings.</li>
                        <li>Associated with local religious practices and community faith.</li>
                        <li>Represents the connection between water and spirituality.</li>
                    </ul>
                `,
                tourism: `
                    <b style='color:#2a5d9f;'>🧭 Tourism Potential</b>
                    <ul>
                        <li>High temple tourism circuit potential.</li>
                        <li>Can be promoted as part of heritage stepwell tours.</li>
                        <li>Represents traditional Rajasthani stepwell architecture.</li>
                        <li>Could be included in cultural heritage circuits.</li>
                    </ul>
                `,
                science: `
                    <b style='color:#2a5d9f;'>🔬 Scientific Novelty</b>
                    <ul>
                        <li>Underground structure design minimized water evaporation.</li>
                        <li>Rectangular stepwell design for optimal water access.</li>
                        <li>Traditional engineering that ensures year-round water availability.</li>
                        <li>Demonstrates sustainable groundwater management.</li>
                    </ul>
                `,
                condition: `
                    <b style='color:#2a5d9f;'>📊 Current Condition</b>
                    <ul>
                        <li>Structure lies neglected with collapsed walls.</li>
                        <li>Partially filled with debris and garbage accumulation.</li>
                        <li>Retains immense cultural and architectural value despite deterioration.</li>
                        <li>Solution: Structural restoration, connect with rainwater recharge, awareness campaigns.</li>
                    </ul>
                `
            }
        }
    };
    
    const currentSection = sectionData[section];
    if (!currentSection) return;
    
    // Create image carousel
    let imageHTML = `
        <div class="ratangarh-image-row-wrapper" style="position:relative;width:100%;height:340px;">
            <button class="ratangarh-arrow ratangarh-arrow-left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8592;</button>
            <div class="ratangarh-image-row" style="height:100%;">
    `;
    
    currentSection.images.forEach((img, i) => {
        imageHTML += `
            <div class="ratangarh-img-box">
                <img src='${img.src}' alt='${currentSection.title} Image ${i+1}'>
                <div class='ratangarh-img-caption'>${img.caption}</div>
            </div>
        `;
    });
    
    imageHTML += `
            </div>
            <button class="ratangarh-arrow ratangarh-arrow-right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;display:none;background:rgba(42,93,159,0.7);border:none;border-radius:50%;width:38px;height:38px;color:#fff;font-size:1.5em;cursor:pointer;align-items:center;justify-content:center;outline:none;transition:background 0.2s;">&#8594;</button>
        </div>
    `;
    
    // Create tabs
    let tabsHTML = `
        <div class="ratangarh-tabs">
            <button class="ratangarh-tab active" data-tab="overview">Overview</button>
            <button class="ratangarh-tab" data-tab="history">📜 History</button>
            <button class="ratangarh-tab" data-tab="uses">💧 Current Uses</button>
            <button class="ratangarh-tab" data-tab="religion">🕉 Religious Significance</button>
            <button class="ratangarh-tab" data-tab="tourism">🧭 Tourism Potential</button>
            <button class="ratangarh-tab" data-tab="science">🔬 Scientific Novelty</button>
            <button class="ratangarh-tab" data-tab="condition">📊 Current Condition</button>
        </div>
        <div class="ratangarh-tab-content" id="atoon-tab-content"></div>
    `;
    
    contentContainer.innerHTML = imageHTML + tabsHTML;
    
    // Initialize tab functionality
    const tabContent = document.getElementById('atoon-tab-content');
    const tabData = currentSection.tabs;
    
    function setTab(tab) {
        tabContent.innerHTML = tabData[tab];
        document.querySelectorAll('.ratangarh-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.ratangarh-tab[data-tab="${tab}"]`).classList.add('active');
    }
    
    setTab('overview');
    document.querySelectorAll('.ratangarh-tab').forEach(btn => {
        btn.onclick = () => setTab(btn.getAttribute('data-tab'));
    });
    
    // Initialize image carousel functionality
    const imageRow = contentContainer.querySelector('.ratangarh-image-row');
    const leftArrow = contentContainer.querySelector('.ratangarh-arrow-left');
    const rightArrow = contentContainer.querySelector('.ratangarh-arrow-right');
    
    let currentIndex = 0;
    const images = currentSection.images;
    
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
    
    scrollToIndex(0);
}

// Initialize map when DOM is loaded
let mapInstance;
document.addEventListener('DOMContentLoaded', function() {
    // Load map data and initialize
    if (typeof mapData !== 'undefined') {
        mapInstance = new InteractiveMap('map', mapData);
    }
});  