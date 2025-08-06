// Map data for JCKIF NEER UDAY Project
const mapData = {
    districts: [
        {
            id: "jodhpur",
            name: "Jodhpur",
            coordinates: [
                (26.311878 + 26.341206 + 26.182362 + 26.121780 + 26.2756 + 26.526706) / 6,
                (73.690678 + 73.042004 + 73.020657 + 72.998051 + 72.9989 + 72.980735) / 6
            ],
            villages: [
                { id: "khejarala", name: "Khejarala", coordinates: [26.311878, 73.690678], description: "Khejarala village.", image: "images/khejarala/1.jpg", report: "khejarala.html" },
                { id: "mandore", name: "Mandore", coordinates: [26.341206, 73.042004], description: "Mandore village.", image: "images/mandore/1.jpg", report: "mandore.html" },
                { id: "sangariya", name: "Sangariya", coordinates: [26.182362, 73.020657], description: "Sangariya village.", image: "images/Sangariya/1.jpg", report: "sangariya.html" },
                { id: "salawas", name: "Salawas", coordinates: [26.121780, 72.998051], description: "Salawas village.", image: "images/Salawas/1.jpg", report: "salawas.html" },
                { id: "osian", name: "Osian", coordinates: [26.2756, 72.9989], description: "Osian village.", image: "images/osian/1.jpg", report: "osian.html" },
                { id: "mathania", name: "Mathania", coordinates: [26.526706, 72.980735], description: "Mathania village.", image: "images/mathania/1.jpg", report: "mathania.html" }
            ]
        },
        {
            id: "pali",
            name: "Pali",
            coordinates: [26.2891, 73.0089],
            villages: [
                { id: "sardar_samand", name: "Sardar Samand", coordinates: [26.2891, 73.0089], description: "Sardar Samand village.", image: "images/sardar_samand/1.jpg", report: "sardar_samand.html" }
            ]
        },
        {
            id: "jaisalmer",
            name: "Jaisalmer",
            coordinates: [
                (26.919431 + 26.954915 + 27.125381 + 27.374339) / 4,
                (71.920681 + 70.887797 + 70.682734 + 70.494761) / 4
            ],
            villages: [
                { id: "pokhran", name: "Pokhran", coordinates: [26.919431, 71.920681], description: "Pokhran village.", image: "images/Pokhran/1.jpg", report: "pokhran.html" },
                { id: "badabagh", name: "Badabagh", coordinates: [26.954915, 70.887797], description: "Badabagh village.", image: "images/badabagh/1.jpg", report: "badabagh.html" },
                { id: "mokla", name: "Mokla", coordinates: [27.125381, 70.682734], description: "Mokla village.", image: "images/mokla/1.jpg", report: "mokla.html" },
                { id: "ramgarh", name: "Ramgarh", coordinates: [27.374339, 70.494761], description: "Ramgarh village.", image: "images/Ramgarh/1.jpg", report: "ramgarh.html" }
            ]
        },
        {
            id: "barmer",
            name: "Barmer",
            coordinates: [
                (25.609432 + 25.609432 + 25.715606 + 25.724986) / 4,
                (71.321526 + 71.321526 + 70.821858 + 70.878381) / 4
            ],
            villages: [
                { id: "ranigaon", name: "Ranigaon", coordinates: [25.609432, 71.321526], description: "Ranigaon village.", image: "images/Ranigaon/1.jpg", report: "ranigaon.html" },
                { id: "ramderiya", name: "Ramderiya", coordinates: [25.609432, 71.321526], description: "Ramderiya village.", image: "images/Ramderiya/1.jpg", report: "ramderiya.html" },
                { id: "siyai", name: "Siyai", coordinates: [25.715606, 70.821858], description: "Siyai village.", image: "images/Siyai/1.jpg", report: "siyai.html" },
                { id: "ramsar", name: "Ramsar", coordinates: [25.724986, 70.878381], description: "Ramsar village.", image: "images/Ramsar/1.jpg", report: "ramsar.html" }
            ]
        },
        {
            id: "churu",
            name: "Churu",
            coordinates: [
                (28.070647 + 28.320121 + 28.672894) / 3,
                (74.624009 + 74.938591 + 75.232712) / 3
            ],
            villages: [
                { id: "ratangarh", name: "Ratangarh & Sethani Ka Johar", coordinates: [28.070647, 74.624009], description: `
                    <b style="color:#2a5d9f; font-size:1.1em;">📜 History</b><br/>
                    Sethani ka Johad was built around 1899 by Sethani Bhagwati Devi, a philanthropist from the Oswal Jain community. Constructed during a devastating famine, the johad served dual purposes—providing water and employment. It is a symbol of community-driven water conservation.
                    <br/><br/>
                    <b style="color:#2a5d9f; font-size:1.1em;">💧 Current Uses</b><br/>
                    <ul style="margin-top:0; margin-bottom:0.5em;">
                        <li>Drinking Water: Still used by nearby residents, especially during dry months.</li>
                        <li>Social Hub: A site for local gatherings, especially during festivals.</li>
                        <li>Environmental Role: Plays a vital part in groundwater recharge.</li>
                    </ul>
                    <br/>
                    <b style="color:#2a5d9f; font-size:1.1em;">🕉 Religious Significance</b><br/>
                    While not a temple tank, it is locally revered due to its historical and charitable origins. Occasionally used for ritual bathing during religious events.
                    <br/><br/>
                    <b style="color:#2a5d9f; font-size:1.1em;">🧭 Tourism Potential</b><br/>
                    <ul style="margin-top:0; margin-bottom:0.5em;">
                        <li>Architectural Heritage: Traditional Rajasthani design with elegant step formations.</li>
                        <li>Eco-Tourism Opportunity: Can be part of a heritage water trail in Churu.</li>
                        <li>Cultural Insight: Tells the story of women's leadership in water conservation.</li>
                    </ul>
                    <br/>
                    <b style="color:#2a5d9f; font-size:1.1em;">🔬 Scientific Novelty</b><br/>
                    <ul style="margin-top:0; margin-bottom:0.5em;">
                        <li>Rainwater Harvesting Design: Sloped catchments, sediment filters, and seepage control.</li>
                        <li>Material Use: Built with lime plaster and local sandstone, offering durability and cooling.</li>
                    </ul>
                    <br/>
                    <b style="color:#2a5d9f; font-size:1.1em;">📊 Current Condition</b><br/>
                    <ul style="margin-top:0; margin-bottom:0.5em;">
                        <li>Water Storage: Fills during monsoon, retains water for 6–8 months depending on rainfall.</li>
                        <li>Water Quality: Fair for livestock; needs regular desilting and cleanup.</li>
                        <li>Maintenance Status: Largely community-maintained, with occasional NGO support.</li>
                    </ul>
                `, image: "images/Ratangarh/10.jpg", report: "ratangarh.html" },
                { id: "gajsar", name: "Gajsar", coordinates: [28.320121, 74.938591], description: "Gajsar village.", image: "images/gajsar/1.jpg", report: "gajsar.html" },
                { id: "dadrewa", name: "Dadrewa", coordinates: [28.672894, 75.232712], description: "Dadrewa village.", image: "images/Dadrewa/1.jpg", report: "dadrewa.html" }
            ]
        },                                                                                                                                        
        {
            id: "rajasmand",
            name: "Rajsamand",
            coordinates: [
                (25.300737 + 25.150419 + 25.071369 + 25.077304) / 4,
                (73.927947 + 73.843907 + 73.870447 + 73.884692) / 4
            ],
            villages: [
                { id: "amet", name: "Amet", coordinates: [25.300737, 73.927947], description: "Amet village.", image: "images/amet/1.jpg", report: "amet.html" },
                { id: "kelwa", name: "Kelwa", coordinates: [25.150419, 73.843907], description: "Kelwa village.", image: "images/Kelwa/1.jpg", report: "kelwa.html" },
                { id: "rajnagar", name: "Rajnagar", coordinates: [25.071369, 73.870447], description: "Rajnagar village.", image: "images/Rajnagar/1.jpg", report: "rajnagar.html" },
                { id: "rajasmand_village", name: "Rajsamand Lake", coordinates: [25.077304, 73.884692], description: "Rajsamand Lake.", image: "images/Rajasmand/1.jpg", report: "rajasmand.html" }
            ]
        }
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mapData;
} 