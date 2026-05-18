"""One-shot frontmatter + rename pass for the I&C OCR pilot.

Reads the raw OCR outputs from research/evidence/_ocr_raw/, prepends YAML
frontmatter sourced from the Zotero search result, and writes the final
markdown into research/evidence/ following Diego's slug convention.

Re-running is idempotent: existing target files are overwritten with the
freshly built frontmatter + body.
"""

from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent

EVIDENCE = Path("/root/repos/Selectron/research/evidence")
RAW = EVIDENCE / "_ocr_raw"

# Order = curated reading order: foundational reviews first, primary studies,
# then methodological / context papers.
PAPERS = [
    {
        "slug": "pagel-chouker-2016-effects-isolation-confinement",
        "raw": "2026-05-18_ocr_pagel-chouker-2016",
        "item_key": "92CG6Z8Z",
        "attachment_key": "S4IVRG2I",
        "title": "Effects of isolation and confinement on humans-implications for manned space explorations",
        "authors": ["Pagel, J. I.", "Choukèr, A."],
        "year": "2016",
        "doi": "10.1152/japplphysiol.00928.2015",
        "publication": "Journal of Applied Physiology",
        "kind": "review",
    },
    {
        "slug": "ponomarev-2021-immunological-aspects-isolation-confinement",
        "raw": "2026-05-18_ocr_ponomarev-2021",
        "item_key": "WW4CIJ5H",
        "attachment_key": "2P83YB3L",
        "title": "Immunological Aspects of Isolation and Confinement",
        "authors": [
            "Ponomarev, Sergey",
            "Kalinin, Sergey",
            "Sadova, Anastasiya",
            "Rykova, Marina",
            "Orlova, Kseniya",
            "Crucian, Brian",
        ],
        "year": "2021",
        "doi": "10.3389/fimmu.2021.697435",
        "publication": "Frontiers in Immunology",
        "kind": "review",
    },
    {
        "slug": "spinelli-werner-2022-antarctic-physiological-adaptation",
        "raw": "2026-05-18_ocr_spinelli-2022",
        "item_key": "7J8RQ8DY",
        "attachment_key": "WBU92FWD",
        "title": "Human adaptative behavior to Antarctic conditions: A review of physiological aspects",
        "authors": ["Spinelli, Eliani", "Werner Junior, Jairo"],
        "year": "2022",
        "doi": "10.1002/wsbm.1556",
        "publication": "WIREs Mechanisms of Disease",
        "kind": "review",
    },
    {
        "slug": "landon-communication-delay-research-state",
        "raw": "2026-05-18_ocr_landon-comm-delay",
        "item_key": "HQ4WJC78",
        "attachment_key": "DD795V5S",
        "title": "Assessment of the State of Communication Delay Research in Preparation for Missions Beyond Low Earth Orbit",
        "authors": [
            "Landon, Lauren B.",
            "Karasinski, John A.",
            "Morissette, Linda G.",
            "Parisi, Megan E.",
        ],
        "year": "",
        "doi": "",
        "publication": "NASA Technical Report (Behavioral Health & Performance)",
        "kind": "review",
    },
    {
        "slug": "inoue-tachibana-2013-isolation-facility-astronaut-selection",
        "raw": "2026-05-18_ocr_inoue-tachibana-2013",
        "item_key": "DXVEMWVY",
        "attachment_key": "UALBVCY8",
        "title": "An isolation and confinement facility for the selection of astronaut candidates",
        "authors": ["Inoue, Natsuhiko", "Tachibana, Shoichi"],
        "year": "2013",
        "doi": "10.3357/ASEM.3188.2013",
        "publication": "Aviation Space and Environmental Medicine",
        "kind": "primary",
    },
    {
        "slug": "abeln-2022-exercise-isolation-confinement-mars500",
        "raw": "2026-05-18_ocr_abeln-2022",
        "item_key": "NH4PNZ7W",
        "attachment_key": "HSEMFIQ6",
        "title": "Chronic, acute and protocol-dependent effects of exercise on psycho-physiological health during long-term isolation and confinement",
        "authors": [
            "Abeln, V.",
            "Fomina, E.",
            "Popova, J.",
            "Braunsmann, L.",
            "Koschate, J.",
            "Möller, F.",
            "Fedyay, S. O.",
            "Vassilieva, G. Y.",
        ],
        "year": "2022",
        "doi": "10.1186/s12868-022-00723-x",
        "publication": "BMC Neuroscience",
        "kind": "primary",
    },
    {
        "slug": "dunn-rosenberg-2022-biobehavioral-stress-mars-analog",
        "raw": "2026-05-18_ocr_dunn-rosenberg-2022",
        "item_key": "TL7IUBDA",
        "attachment_key": "PK4SY32C",
        "title": "Biobehavioral and psychosocial stress changes during three 8-12 month spaceflight analog missions with Mars-like conditions of isolation and confinement",
        "authors": [
            "Dunn Rosenberg, Jocelyn",
            "Jannasch, Amber",
            "Binsted, Kim",
            "Landry, Steven",
        ],
        "year": "2022",
        "doi": "10.3389/fphys.2022.898841",
        "publication": "Frontiers in Physiology",
        "kind": "primary",
    },
    {
        "slug": "malpica-2024-thor-isolation-confinement-responses",
        "raw": "2026-05-18_ocr_malpica-2024",
        "item_key": "STIBXURT",
        "attachment_key": "NZQXAWWJ",
        "title": "Investigating the psychological and physiological responses to isolation and confinement using the THOR space analog simulation",
        "authors": [
            "Malpica, Diego",
            "Pico, Nindre",
            "Lozano, Juan Esteban",
            "Cortes, Diego",
            "Campos, Cristhian",
            "Bejarano, Xiomara",
        ],
        "year": "2024",
        "doi": "10.17981/JACN.4.2.2023.4",
        "publication": "Journal of Applied Cognitive Neuroscience",
        "kind": "primary",
    },
    {
        "slug": "giacon-2024-emmpol6-stress-biomarkers",
        "raw": "2026-05-18_ocr_giacon-2024",
        "item_key": "2QTCGT89",
        "attachment_key": "VUAVUURA",
        "title": "Environmental study and stress-related biomarkers modifications in a crew during analog astronaut mission EMMPOL 6",
        "authors": [
            "Giacon, T. A.",
            "Mrakic-Sposta, Simona",
            "Bosco, G.",
            "Vezzoli, A.",
            "Dellanoce, Cinzia",
            "Campisi, M.",
            "Narici, M.",
            "Paganini, M.",
            "Foing, B.",
            "Kołodziejczyk, A.",
            "Martinelli, M.",
            "Pavanello, S.",
        ],
        "year": "2024",
        "doi": "10.1007/s00421-024-05575-3",
        "publication": "European Journal of Applied Physiology",
        "kind": "primary",
    },
    {
        "slug": "hudson-pre-antarctic-training",
        "raw": "2026-05-18_ocr_hudson-antarctic",
        "item_key": "52XLB3PY",
        "attachment_key": "CFSYUGZU",
        "title": "Exploring the Predeployment Phase of an Antarctic Expedition and the Brazilian Pre-Antarctic Training",
        "authors": [
            "Hudson, Ribeiro",
            "Moraes, Michele Macedo",
            "Alexandre, S.",
            "Antônio, Ygor",
            "Martins, Tinoco",
            "Marques, Alice Lamounier",
            "Bruzzi, Rúbio Sabino",
            "Mendes, Thiago Teixeira",
        ],
        "year": "",
        "doi": "",
        "publication": "Military Medicine (usac154)",
        "kind": "primary",
    },
    {
        "slug": "barros-delben-2026-analog-habitat-health-safety-protocol",
        "raw": "2026-05-18_ocr_barros-delben-2026",
        "item_key": "BFIHJNIY",
        "attachment_key": "987WL9GB",
        "title": "Analog Habitat Health and Safety Protocol: Replicable Standard System for Analyzing Data related to Human Factors in Simulations",
        "authors": [
            "Barros-Delben, Paola",
            "Skorupa, Agnieszka",
            "Barros-Delben, Priscilla",
            "Barros-Delben, Natasha",
            "Olivlet, Lorrane",
            "Weeresinghe, Rachel",
            "Mendes, Thiago",
            "Marques-Quinteiro, Pedro",
            "Gonzalez, Luciano Emanuel",
            "Silvestre, Daniela",
        ],
        "year": "2026",
        "doi": "10.1016/j.lssr.2026.01.011",
        "publication": "Life Sciences in Space Research",
        "kind": "methodology",
    },
    # ------------------------------------------------------------------
    # Tier-2 batch (added 2026-05-18) — broader I&C analog evidence
    # to fill Tier-1 gaps: Mars500 psych/behavioral, Antarctic-specific
    # psych & sleep, team dynamics, isolation countermeasures, and
    # foundational long-term-isolation studies. Authors, titles, DOIs,
    # and publication names are sourced directly from the Zotero record
    # (canonical) with OCR-body verification for missing DOIs.
    # ------------------------------------------------------------------
    {
        "slug": 'basner-2014-mars500-psychological-behavioral-changes',
        "raw": '2026-05-18_ocr_basner-2014',
        "item_key": 'MRS49H57',
        "attachment_key": 'TQ7PZC5B',
        "title": 'Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to mars',
        "authors": [
            'Basner, Mathias',
            'Dinges, David F.',
            'Mollicone, Daniel J.',
            'Savelev, Igor',
            'Ecker, Adrian J.',
            'Di Antonio, Adrian',
            'Jones, Christopher W.',
            'Hyder, Eric C.',
            'Kan, Kevin',
            'Morukov, Boris V.',
            'Sutton, Jeffrey P.',
        ],
        "year": '2014',
        "doi": '10.1371/journal.pone.0093298',
        "publication": 'PLoS ONE',
        "kind": 'primary',
    },
    {
        "slug": 'sandal-2018-psychological-hibernation-antarctica',
        "raw": '2026-05-18_ocr_sandal-2018',
        "item_key": 'A5THD9NZ',
        "attachment_key": 'KAAEAE4D',
        "title": 'Psychological hibernation in antarctica',
        "authors": [
            'Sandal, Gro Mjeldheim',
            'van de Vijver, Fons J.R.',
            'Smith, Nathan',
        ],
        "year": '2018',
        "doi": '10.3389/fpsyg.2018.02235',
        "publication": 'Frontiers in Psychology',
        "kind": 'primary',
    },
    {
        "slug": 'tortello-2020-antarctic-isolation-confinement-coping',
        "raw": '2026-05-18_ocr_tortello-2020',
        "item_key": 'CGE4PF7Q',
        "attachment_key": 'BK6GUSDZ',
        "title": 'Coping with Antarctic demands: Psychological implications of isolation and confinement',
        "authors": [
            'Tortello, Camila',
            'Folgueira, Agustín',
            'Nicolas, Michel',
            'Cuiuli, Juan Manuel',
            'Cairoli, Germán',
            'Crippa, Valeria',
            'Barbarito, Marta',
            'Abulafia, Carolina',
            'Golombek, Diego Andrés',
            'Vigo, Daniel Eduardo',
            'Plano, Santiago Andrés',
        ],
        "year": '2020',
        "doi": '10.1002/smi.3006',
        "publication": 'Stress and Health',
        "kind": 'primary',
    },
    {
        "slug": 'palinkas-2004-antarctic-psychiatric-disorders',
        "raw": '2026-05-18_ocr_palinkas-2004',
        "item_key": 'PS32UHT4',
        "attachment_key": 'NRT3QCU8',
        "title": 'Incidence of psychiatric disorders after extended residence in Antarctica',
        "authors": [
            'Palinkas, Lawrence A',
            'Glogower, Frederic',
            'Dembert, Mark',
            'Hansen, Kendall',
            'Smullen, Robert',
        ],
        "year": '2004',
        "doi": '10.3402/ijch.v63i2.17702',
        "publication": 'International journal of circumpolar health',
        "kind": 'primary',
    },
    {
        "slug": 'roma-2017-team-dynamics-long-duration-extreme',
        "raw": '2026-05-18_ocr_roma-2017',
        "item_key": 'BJQ46W5J',
        "attachment_key": '9CPDCTC4',
        "title": 'Key factors and threats to team dynamics in long-duration extreme environments',
        "authors": [
            'Roma, Peter G.',
            'Bedwell, Wendy L.',
        ],
        "year": '2017',
        "doi": '10.1108/S1534-085620160000018007',
        "publication": 'Research on Managing Groups and Teams',
        "kind": 'review',
    },
    {
        "slug": 'bell-2019-team-dynamics-long-distance-space-missions',
        "raw": '2026-05-18_ocr_bell-2019',
        "item_key": 'UA65I4VP',
        "attachment_key": 'VW6RW5ZX',
        "title": 'What we know about team dynamics for long-distance space missions: A systematic review of analog research',
        "authors": [
            'Bell, Suzanne T.',
            'Brown, Shanique G.',
            'Mitchell, Tyree',
        ],
        "year": '2019',
        "doi": '10.3389/fpsyg.2019.00811',
        "publication": 'Frontiers in Psychology',
        "kind": 'review',
    },
    {
        "slug": 'shved-2022-isolation-crowding-countermeasures',
        "raw": '2026-05-18_ocr_shved-2022',
        "item_key": 'UIY3VRUY',
        "attachment_key": 'M74B2KBB',
        "title": 'Effects of isolation, crowding, and different psychological countermeasures on crew behavior and performance',
        "authors": [
            'Shved, Dmitry',
            'Kuznetsova, Polina',
            'Rozanov, Ivan A.',
            'Lebedeva, Svetlana A.',
            'Vinokhodova, Alla',
            'Savinkina, Alexandra',
            'Shishenina, Ksenia',
            'Rey, Nicole Diaz',
            'Gushin, Vadim',
        ],
        "year": '2022',
        "doi": '10.3389/fphys.2022.963301',
        "publication": 'Frontiers in Physiology',
        "kind": 'primary',
    },
    {
        "slug": 'gemignani-2014-105d-isolation-sleep-cortisol',
        "raw": '2026-05-18_ocr_gemignani-2014',
        "item_key": 'AXBJF9AB',
        "attachment_key": 'BQEFQAWU',
        "title": 'How stressful are 105 days of isolation? Sleep EEG patterns and tonic cortisol in healthy volunteers simulating manned flight to Mars',
        "authors": [
            'Gemignani, Angelo',
            'Piarulli, Andrea',
            'Menicucci, Danilo',
            'Laurino, Marco',
            'Rota, Giuseppina',
            'Mastorci, Francesca',
            'Gushin, Vadim',
            'Shevchenko, Olga',
            'Garbella, Erika',
            'Pingitore, Alessandro',
        ],
        "year": '2014',
        "doi": '10.1016/j.ijpsycho.2014.04.008',
        "publication": 'International Journal of Psychophysiology',
        "kind": 'primary',
    },
    {
        "slug": 'leon-2011-human-performance-polar-environments',
        "raw": '2026-05-18_ocr_leon-2011',
        "item_key": 'G86FXAMX',
        "attachment_key": 'M2L6GFMB',
        "title": 'Human performance in polar environments',
        "authors": [
            'Leon, Gloria R',
            'Sandal, Gro Mjeldheim',
            'Larsen, Eric',
        ],
        "year": '2011',
        "doi": '10.1016/j.jenvp.2011.08.001',
        "publication": 'Journal of environmental psychology',
        "kind": 'review',
    },
    {
        "slug": 'tafforin-2015-confinement-vs-isolation-mars-analogs',
        "raw": '2026-05-18_ocr_tafforin-2015',
        "item_key": 'LQL6HF2V',
        "attachment_key": '8A5CV9K2',
        "title": 'Confinement vs. isolation as analogue environments for mars missions from a human ethology viewpoint',
        "authors": [
            'Tafforin, Carole',
        ],
        "year": '2015',
        "doi": '10.3357/AMHP.4100.2015',
        "publication": 'Aerospace Medicine and Human Performance',
        "kind": 'review',
    },
    {
        "slug": 'glos-2026-sleep-ans-four-month-isolation',
        "raw": '2026-05-18_ocr_glos-2026',
        "item_key": 'TBYFEVGY',
        "attachment_key": 'B7QMMDF6',
        "title": 'Sleep structure and autonomic nervous system state during four months of isolation in a space analogue mission',
        "authors": [
            'Glos, Martin',
            'Salanitro, Matthew',
            'Laharnar, Naima',
            'Demin, Artem',
            'Penzel, Thomas',
            'Fietze, Ingo',
        ],
        "year": '2026',
        "doi": '10.3389/fnhum.2026.1720237',
        "publication": 'Frontiers in Human Neuroscience',
        "kind": 'primary',
    },
    {
        "slug": 'cromwell-2021-earth-based-analogs-space-health-risks',
        "raw": '2026-05-18_ocr_cromwell-2021',
        "item_key": 'XFQVITH8',
        "attachment_key": 'R7QAS3FJ',
        "title": 'Earth-Based Research Analogs to Investigate Space-Based Health Risks',
        "authors": [
            'Cromwell, Ronita L.',
            'Huff, Janice L.',
            'Simonsen, Lisa C.',
            'Patel, Zarana S.',
        ],
        "year": '2021',
        "doi": '10.1089/space.2020.0048',
        "publication": 'New Space',
        "kind": 'review',
    },
    {
        "slug": 'zimmer-2013-antarctic-psychological-changes-systematic-overview',
        "raw": '2026-05-18_ocr_zimmer-2013',
        "item_key": '3WGXJSES',
        "attachment_key": 'NNP75TA5',
        "title": 'Psychological changes arising from an Antarctic stay: Systematic overview',
        "authors": [
            'Zimmer, Marilene',
            'Cabral, João Carlos Centurion Rodrigues',
            'Borges, Fernanda Czarneski',
            'Côco, Karen Gonçalves',
            'Hameister, Bianca da Rocha',
        ],
        "year": '2013',
        "doi": '',
        "publication": 'Estudos de Psicologia (Campinas)',
        "kind": 'review',
    },
    {
        "slug": 'pattyn-2017-antarctic-sleep-polar-insomnia',
        "raw": '2026-05-18_ocr_pattyn-2017',
        "item_key": 'EXSVPSQC',
        "attachment_key": '24SEP64W',
        "title": 'Sleep during an Antarctic summer expedition: new light on "polar insomnia"',
        "authors": [
            'Pattyn, Nathalie',
            'Mairesse, Olivier',
            'Cortoos, Aisha',
            'Marcoen, Nele',
            'Neyt, Xavier',
            'Meeusen, Romain',
        ],
        "year": '2017',
        "doi": '10.1152/japplphysiol.00606.2016.-Sleep',
        "publication": 'J Appl Physiol',
        "kind": 'primary',
    },
    {
        "slug": 'vermeulen-1977-small-group-long-term-isolation',
        "raw": '2026-05-18_ocr_vermeulen-1977',
        "item_key": 'ZNLBH5WP',
        "attachment_key": 'J3ZZCQLG',
        "title": 'Small-group behaviour in long-term isolation',
        "authors": [
            'Vermeulen, L. P.',
        ],
        "year": '1977',
        "doi": '10.1080/02580144.1977.10429245',
        "publication": 'South African Journal of Sociology',
        "kind": 'primary',
    },
    {
        "slug": 'mcmenamin-2020-amadee18-mars-analog-team-processes',
        "raw": '2026-05-18_ocr_mcmenamin-2020',
        "item_key": 'IMBIBXCU',
        "attachment_key": 'P9AX9HFB',
        "title": 'Team Processes and Outcomes during the AMADEE-18 Mars Analog Mission',
        "authors": [
            'McMenamin, Julia',
            'Allen, Natalie J.',
            'Battler, Melissa',
        ],
        "year": '2020',
        "doi": '10.1089/ast.2019.2035',
        "publication": 'Astrobiology',
        "kind": 'primary',
    },
    {
        "slug": 'tafforin-2013-mars500-crew-ethological-study',
        "raw": '2026-05-18_ocr_tafforin-2013',
        "item_key": '3AMGLYCT',
        "attachment_key": '3SGSTN82',
        "title": 'The Mars-500 crew in daily life activities: An ethological study',
        "authors": [
            'Tafforin, Carole',
        ],
        "year": '2013',
        "doi": '10.1016/j.actaastro.2013.05.001',
        "publication": 'Acta Astronautica',
        "kind": 'primary',
    },
    {
        "slug": 'vigo-2013-mars500-circadian-cardiovascular-autonomic',
        "raw": '2026-05-18_ocr_vigo-2013',
        "item_key": 'P6F8YKPI',
        "attachment_key": 'USDM7QQ6',
        "title": 'Circadian rhythm of autonomic cardiovascular control during Mars500 simulated mission to Mars',
        "authors": [
            'Vigo, Daniel E',
            'Tuerlinckx, Francis',
            'Ogrinz, Barbara',
            'Wan, Li',
            'Simonelli, Guido',
            'Bersenev, Evgeny',
            'Van den Bergh, Omer',
            'Aubert, André E',
        ],
        "year": '2013',
        "doi": '10.3357/ASEM.3612.2013',
        "publication": 'Aviation, space, and environmental medicine',
        "kind": 'primary',
    },
    {
        "slug": 'nirwan-2022-antarctic-psychophysiology',
        "raw": '2026-05-18_ocr_nirwan-2022',
        "item_key": '9ACTFRWB',
        "attachment_key": '2TH78D3T',
        "title": 'Human psychophysiology in Antarctica',
        "authors": [
            'Nirwan, Mohit',
        ],
        "year": '2022',
        "doi": '10.25259/SRJHS_4_2022',
        "publication": 'Sri Ramachandra Journal of Health Sciences',
        "kind": 'review',
    },
    {
        "slug": 'verhoeven-2022-multiteam-systems-long-duration-exploration',
        "raw": '2026-05-18_ocr_verhoeven-2022',
        "item_key": 'HJRPB8YJ',
        "attachment_key": 'NRQ8EMQ4',
        "title": 'Multiteam Systems in Long Duration Exploration Missions: A Qualitative Analysis of Key Characteristics and Challenges',
        "authors": [
            'Verhoeven, Dana C.',
            'Kramer, William S.',
            'Shuffler, Marissa L.',
        ],
        "year": '2022',
        "doi": '10.3389/fpsyg.2022.877509',
        "publication": 'Frontiers in Psychology',
        "kind": 'review',
    },
]


def yaml_list(items: list[str]) -> str:
    """Render a YAML list of scalars, quoting each element to survive
    commas / colons / unicode / apostrophes inside author names."""
    quoted = [f'"{s.replace("\"", "\\\"")}"' for s in items]
    return "[" + ", ".join(quoted) + "]"


def yaml_quote(s: str) -> str:
    """Escape backslashes and double-quotes so the value survives YAML
    double-quoted-scalar parsing. Required for titles that contain nested
    quotes (e.g. Pattyn 2017's `... "polar insomnia"`)."""
    return s.replace("\\", "\\\\").replace("\"", "\\\"")


def build_frontmatter(p: dict, pages: int) -> str:
    doi_line = f'doi: "{yaml_quote(p["doi"])}"' if p["doi"] else 'doi: ""'
    return dedent(
        f"""\
        ---
        source: zotero
        zotero_item_key: {p["item_key"]}
        zotero_attachment_key: {p["attachment_key"]}
        title: "{yaml_quote(p["title"])}"
        authors: {yaml_list(p["authors"])}
        year: "{p["year"]}"
        {doi_line}
        publication: "{yaml_quote(p["publication"])}"
        kind: {p["kind"]}
        topic: isolation-and-confinement
        retrieved: 2026-05-18
        ocr_model: mistral-ocr-latest
        ocr_pages: {pages}
        ---

        """
    )


def main() -> None:
    written = []
    for p in PAPERS:
        md_src = RAW / f"{p['raw']}.md"
        meta_src = RAW / f"{p['raw']}_meta.json"
        if not md_src.exists():
            raise FileNotFoundError(md_src)
        meta = json.loads(meta_src.read_text())
        body = md_src.read_text()
        frontmatter = build_frontmatter(p, meta["pages_processed"])
        target = EVIDENCE / f"{p['slug']}.md"
        target.write_text(frontmatter + body)
        written.append((p["slug"], meta["pages_processed"]))
    print(f"wrote {len(written)} markdowns to {EVIDENCE}")
    for slug, pages in written:
        print(f"  {pages:>3} pages  {slug}.md")


if __name__ == "__main__":
    main()
