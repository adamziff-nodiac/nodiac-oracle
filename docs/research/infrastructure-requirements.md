# Data Center Infrastructure Requirements

## Power Requirements

### Typical Facility Sizes
| Tier | Capacity | Use Case |
|------|----------|----------|
| Edge | 1-5 MW | Low-latency apps |
| Enterprise | 5-20 MW | Corporate IT |
| Hyperscale | 50-500+ MW | Cloud, AI training |
| Campus | 500 MW - 2 GW | Multi-building |

### Power Architecture
- **Redundancy**: 2N (fully redundant) for critical loads
- **UPS**: Battery backup for 10-15 minutes
- **Generators**: Diesel/natural gas for extended outages
- **PUE Target**: <1.3 (industry leading <1.1)

### Grid Connection Challenges
- Interconnection queue: 4-7 year wait times
- Substation requirements for large loads
- Transmission capacity constraints
- Utility rate negotiations

## Fiber & Connectivity

### Network Requirements
- **Dark Fiber**: 12-144 strand runs typical
- **Latency**: <1ms for adjacent markets, <10ms regional
- **Diverse Paths**: Minimum 2 carriers, 2 physical routes
- **Meet-Me Rooms**: Cross-connect hubs for carrier neutral

### Connectivity Tiers
1. **Tier 1**: Direct peering with major carriers
2. **Tier 2**: Transit providers, regional networks
3. **Tier 3**: Last-mile fiber to enterprise

### Key Connectivity Hubs
- **US**: Ashburn, Silicon Valley, Dallas, Chicago
- **Europe**: Frankfurt (DE-CIX), London, Amsterdam
- **Asia**: Singapore, Tokyo, Hong Kong

## Water & Cooling

### Water Consumption
- Traditional air cooling: 1.8L per kWh
- Evaporative cooling: Significant water use
- Liquid cooling: Reducing water dependency

### Cooling Technologies
| Method | PUE Impact | Water Use | Best For |
|--------|------------|-----------|----------|
| Air (CRAC) | 1.5-2.0 | Low | Low density |
| Evaporative | 1.2-1.5 | High | Hot climates |
| Chilled Water | 1.3-1.6 | Medium | Large facilities |
| Liquid/Immersion | 1.05-1.2 | Very Low | AI/HPC |

### Water Stress Considerations
- Western US facing drought constraints
- European water recycling mandates emerging
- Waterless cooling gaining traction

## Site Selection Criteria

### Tier 1 Factors
1. **Power**: Available MW, cost, renewable access
2. **Fiber**: Carrier diversity, latency to users
3. **Land**: Cost, zoning, expansion potential
4. **Climate**: Cooling advantages, natural disaster risk

### Tier 2 Factors
1. **Tax Incentives**: Sales tax exemptions, property tax abatements
2. **Labor**: Technical workforce availability
3. **Permitting**: Speed and predictability
4. **Community**: Local support, NIMBYism risk

### Emerging Location Trends
- **Secondary Markets**: Phoenix, Atlanta, Salt Lake City
- **International**: Nordic countries, Middle East
- **Edge**: Population centers for latency-sensitive apps
- **Renewable Zones**: Texas ERCOT, wind corridors

## AI/ML Specific Requirements

### GPU Infrastructure
- NVIDIA H100/B100 clusters: 700W-1000W per GPU
- Dense rack configurations: 40-80 kW per rack
- Liquid cooling mandatory at scale
- InfiniBand networking for training clusters

### Training vs Inference
| Attribute | Training | Inference |
|-----------|----------|-----------|
| Power Density | Very High | Medium-High |
| Latency Sensitivity | Low | High |
| Location Flexibility | High | Low |
| Utilization | Burst | Continuous |

### Key Constraints
- GPU availability (18-24 month lead times)
- Power delivery to rack
- Cooling capacity
- Network bandwidth between GPUs
