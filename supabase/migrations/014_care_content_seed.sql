-- Care tips and Learn articles. Content is general information with a source for every item.
-- Upserts so the seed can be re-run after edits.

insert into care_tips (code, kind, topic, icon, title, body, audience, trigger, source, source_url, reviewed) values
('treats-under-15-percent', 'tip', 'nutrition', '🍪', 'Keep treats to a small share of calories', 'Cornell''s Feline Health Center suggests treats should not exceed 10 to 15 percent of your cat''s daily calories. Count them as part of the day''s food, not on top of it.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feeding your cat', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat', '2026-10-08'),
('complete-and-balanced-label', 'tip', 'nutrition', '🏷️', 'Look for complete and balanced on the label', 'Foods that meet AAFCO nutrient profiles are labelled nutritionally complete and balanced, and the label should state the life stage, such as kitten or adult. Supplements should only be given with your veterinarian''s approval.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feeding your cat', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat', '2026-10-08'),
('wet-food-moisture-fact', 'fact', 'hydration', '💧', 'Wet food is mostly water', 'Canned cat food contains at least 75 percent moisture, while dry food contains about 6 to 10 percent. Wet meals can make a useful contribution to your cat''s daily water intake.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feeding your cat', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat', '2026-10-08'),
('raw-food-fda-study', 'fact', 'nutrition', '🥩', 'Raw diets carry a bacterial risk for people too', 'In an FDA study of 196 raw dog and cat food samples, 15 tested positive for Salmonella and 32 for Listeria monocytogenes. The FDA notes these bacteria can spread to the people handling the food.', '{}'::jsonb, null, 'FDA: Get the facts, raw pet food diets can be dangerous to you and your pet', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-raw-pet-food-diets-can-be-dangerous-you-and-your-pet', '2026-10-08'),
('raw-food-safe-handling', 'tip', 'nutrition', '🧼', 'Handling raw food safely', 'If you feed raw, the FDA advises thawing it in the fridge, not on the counter, washing hands with soap for 20 seconds, and cleaning then disinfecting bowls and surfaces. Refrigerate or discard leftovers promptly.', '{}'::jsonb, null, 'FDA: Get the facts, raw pet food diets can be dangerous to you and your pet', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-raw-pet-food-diets-can-be-dangerous-you-and-your-pet', '2026-10-08'),
('five-pillars-environment', 'fact', 'environment', '🏛️', 'Cat vets describe five pillars of a healthy home', 'AAFP and ISFM guidelines list a safe place, multiple separated resources, play and predatory outlets, predictable human interaction, and respect for the cat''s sense of smell.', '{}'::jsonb, null, 'VCA Animal Hospitals: Feline environmental needs guidelines', 'https://vcahospitals.com/pediatric/kitten/health-wellness/feline-environmental-needs-guidelines', '2026-10-08'),
('separate-key-resources', 'tip', 'environment', '🧭', 'Keep food, water and litter apart', 'Give each key resource its own location, and keep food well away from the litter tray. The guidelines suggest at least two options for each resource.', '{}'::jsonb, null, 'VCA Animal Hospitals: Feline environmental needs guidelines', 'https://vcahospitals.com/pediatric/kitten/health-wellness/feline-environmental-needs-guidelines', '2026-10-08'),
('safe-hiding-places', 'tip', 'environment', '📦', 'Offer at least one hiding place per cat', 'Boxes, carriers, perches and hideaways give your cat a private retreat. Many cats prefer a raised spot, and there should be at least as many safe spaces as there are cats.', '{}'::jsonb, null, 'VCA Animal Hospitals: Feline environmental needs guidelines', 'https://vcahospitals.com/pediatric/kitten/health-wellness/feline-environmental-needs-guidelines', '2026-10-08'),
('stroking-green-zones', 'tip', 'massage', '🤲', 'Stroke the cheeks, chin and head', 'Most cats enjoy touch on the cheeks, chin and head. Many are less comfortable on the body or tail, and it is best to avoid the legs, belly and base of the tail.', '{}'::jsonb, null, 'International Cat Care: Cat friendly interaction', 'https://icatcare.org/articles/cat-friendly-interaction', '2026-10-08'),
('three-second-rule', 'tip', 'massage', '⏱️', 'Try the 3-second rule', 'Touch for about 3 seconds, then pause and see whether your cat moves closer for more. Moving away, freezing or tensing are signs to stop.', '{}'::jsonb, null, 'International Cat Care: Cat friendly interaction', 'https://icatcare.org/articles/cat-friendly-interaction', '2026-10-08'),
('belly-not-an-invitation', 'fact', 'massage', '🙃', 'A shown belly is usually not a request for a rub', 'Cats Protection notes that for most cats a rolled-over belly is not an invitation to touch. Gently stroking the head or cheeks is a better response.', '{}'::jsonb, null, 'Cats Protection: How to pet a cat', 'https://www.cats.org.uk/cats-blog/how-to-pet-a-cat', '2026-10-08'),
('taste-buds-fact', 'fact', 'nutrition', '👅', 'Cats have a few hundred taste buds', 'PetMD puts the figure at about 473 taste buds in cats, compared with about 1,700 in dogs and about 9,000 in people. Smell plays a large part in a cat''s appetite.', '{}'::jsonb, null, 'PetMD: 10 fun facts about cats', 'https://www.petmd.com/cat/general-health/fun-facts-about-cats', '2026-10-08'),
('no-sweet-taste', 'fact', 'nutrition', '🍬', 'Cats probably cannot taste sweetness', 'One of the two genes needed for the sweet taste receptor, Tas1r2, is not expressed in cats. Researchers concluded cats lack the receptor likely needed to detect sweet tastes.', '{}'::jsonb, null, 'Li et al. 2005, PLoS Genetics: Pseudogenization of a sweet-receptor gene accounts for cats'' indifference toward sugar', 'https://pubmed.ncbi.nlm.nih.gov/16103917/', '2026-10-08'),
('name-recognition', 'fact', 'mind', '🔤', 'Cats can tell their name from other words', 'In a 2019 study, household cats responded more to their own name than to similar-sounding nouns or other cats'' names, even when a stranger spoke it.', '{}'::jsonb, null, 'Saito et al. 2019, Scientific Reports: Domestic cats discriminate their names from other words', 'https://pubmed.ncbi.nlm.nih.gov/30948740/', '2026-10-08'),
('social-referencing', 'fact', 'mind', '👀', 'Cats look to you when something is new', 'Faced with an unfamiliar object, 79 percent of cats in one study looked back and forth between it and their owner, and partly adjusted their behaviour to the owner''s tone and expression.', '{}'::jsonb, null, 'Merola et al. 2015, Animal Cognition: Social referencing and cat-human communication', 'https://pubmed.ncbi.nlm.nih.gov/25573289/', '2026-10-08'),
('attachment-styles', 'fact', 'mind', '🫶', 'Cats form attachment bonds with their people', 'Using tests developed for human infants, researchers found that cats show distinct attachment styles toward their caregivers, including secure attachment.', '{}'::jsonb, null, 'Vitale et al. 2019, Current Biology: Attachment bonds between domestic cats and humans', 'https://pubmed.ncbi.nlm.nih.gov/31550468/', '2026-10-08'),
('emotion-cues', 'fact', 'mind', '🙂', 'Cats notice your mood, mostly yours', 'A 2016 study found cats were modestly sensitive to human emotional expressions, and more so when the emotion came from their own owner than from a stranger.', '{}'::jsonb, null, 'Galvan and Vonk 2016, Animal Cognition: Domestic cats and their discrimination of human emotion cues', 'https://pubmed.ncbi.nlm.nih.gov/26400749/', '2026-10-08'),
('gradual-food-switch', 'tip', 'nutrition', '🔄', 'Switch foods over 7 to 10 days', 'Mix about 25 percent new food with 75 percent old for two days, then 50/50, then 75 percent new, and go fully new from around day 7. Slow down if you notice vomiting, diarrhoea or reduced appetite.', '{}'::jsonb, null, 'PetMD: How to switch cat food', 'https://www.petmd.com/cat/nutrition/how-to-switch-cat-food', '2026-10-08'),
('litter-trays-n-plus-one', 'tip', 'environment', '🚽', 'One litter tray per cat, plus one', 'Provide one tray per cat plus one extra, so three cats need at least four. In a home with several floors, a tray on each level can help.', '{}'::jsonb, null, 'ASPCA: Litter box problems', 'https://www.aspca.org/pet-care/cat-care/common-cat-behavior-issues/litter-box-problems', '2026-10-08'),
('litter-trays-spread-out', 'tip', 'environment', '📍', 'Spread litter trays around the home', 'Trays placed side by side may be seen as one tray. Put them in separate, discreet spots away from food, water and exits.', '{}'::jsonb, null, 'International Cat Care: Making your home cat friendly', 'https://icatcare.org/articles/making-your-home-cat-friendly', '2026-10-08'),
('litter-unscented-scoop-daily', 'tip', 'environment', '🧹', 'Scoop daily and choose unscented litter', 'Most cats prefer unscented, finer-textured litter about 2.5 to 5 cm (1 to 2 inches) deep. Remove waste every day and avoid strongly scented cleaners.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feline behavior problems, house soiling', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-behavior-problems-house-soiling', '2026-10-08'),
('vertical-space', 'tip', 'environment', '🧗', 'Give your cat high places to rest', 'Cats like to rest and watch their surroundings from up high. Shelves, cupboard tops or cat trees all work; check that older cats can get down easily.', '{}'::jsonb, null, 'International Cat Care: Making your home cat friendly', 'https://icatcare.org/articles/making-your-home-cat-friendly', '2026-10-08'),
('water-away-from-food', 'tip', 'hydration', '🥣', 'Place water away from the food bowl', 'Keep the water bowl far enough from food that crumbs cannot fall in. Clean, fresh water should be available at all times.', '{}'::jsonb, null, 'International Cat Care: Making your home cat friendly', 'https://icatcare.org/articles/making-your-home-cat-friendly', '2026-10-08'),
('tall-scratching-post', 'tip', 'environment', '🪵', 'Choose a tall, sturdy scratching post', 'A post tall enough for your cat to scratch at full stretch works best. Offering a few different surfaces helps you find what your cat prefers.', '{}'::jsonb, null, 'International Cat Care: Making your home cat friendly', 'https://icatcare.org/articles/making-your-home-cat-friendly', '2026-10-08'),
('predatory-sequence-play', 'fact', 'play', '🐭', 'Play follows the hunting sequence', 'Cat play mirrors the predatory sequence: search, stalk, chase, pounce, catch and manipulate. Games that never allow a catch can leave cats frustrated.', '{}'::jsonb, null, 'International Cat Care: Playing with your cat', 'https://icatcare.org/articles/playing-with-your-cat', '2026-10-08'),
('short-play-bursts', 'tip', 'play', '⚡', 'Short, frequent play beats long sessions', 'Cats are sprinters rather than marathon runners, so about a minute of intense play can be a good result. Several short sessions through the day suit them better than one long one.', '{}'::jsonb, null, 'International Cat Care: Playing with your cat', 'https://icatcare.org/articles/playing-with-your-cat', '2026-10-08'),
('laser-then-catch', 'tip', 'play', '🎯', 'Finish laser games with something to catch', 'A laser dot can be chased but never caught. End the game with a wand toy or small toy your cat can grab, then offer a meal or treat as the hunt''s reward.', '{}'::jsonb, null, 'International Cat Care: Playing with your cat', 'https://icatcare.org/articles/playing-with-your-cat', '2026-10-08'),
('rotate-toys', 'tip', 'play', '🔁', 'Rotate toys to keep them interesting', 'Keep two or three small toys out and offer one at a time, swapping them regularly so they stay novel.', '{}'::jsonb, null, 'International Cat Care: Playing with your cat', 'https://icatcare.org/articles/playing-with-your-cat', '2026-10-08'),
('put-wand-toys-away', 'tip', 'safety', '🧶', 'Put string and wand toys away after play', 'Swallowed string, ribbon or wool can cause serious intestinal injury that needs emergency surgery. Store wand toys out of reach when you are not playing together.', '{}'::jsonb, null, 'International Cat Care: Playing with your cat', 'https://icatcare.org/articles/playing-with-your-cat', '2026-10-08'),
('male-straining-urgent', 'tip', 'safety', '🚨', 'Straining in the litter tray is an emergency', 'Repeated attempts to urinate with little or nothing passed, especially in a male cat, need a vet immediately. A urethral blockage can be fatal within 2 to 3 days and is sometimes mistaken for constipation.', '{}'::jsonb, null, 'International Cat Care: Urethral obstruction in cats', 'https://icatcare.org/articles/urethral-obstruction-in-cats', '2026-10-08'),
('open-mouth-breathing', 'tip', 'safety', '🫁', 'Open-mouth breathing needs a vet now', 'Cats normally breathe through the nose. Difficulty breathing, especially with the mouth open or panting, is a reason to get to a veterinarian immediately.', '{}'::jsonb, null, 'VCA Animal Hospitals: Emergencies in cats', 'https://vcahospitals.com/know-your-pet/emergencies-in-cats', '2026-10-08'),
('not-eating-24h', 'tip', 'health', '🍽️', 'No proper meal for 24 hours needs a vet', 'VCA advises seeking veterinary attention if a cat has not eaten properly for 24 hours. Cats that stop eating can develop a serious liver condition called hepatic lipidosis.', '{}'::jsonb, null, 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('lilies-toxic', 'fact', 'safety', '🌸', 'A few grains of lily pollen can harm a cat', 'True lilies and daylilies are toxic to cats in every part, including pollen and vase water. Kidney failure can follow within 24 to 72 hours, so contact a vet straight away after any exposure.', '{}'::jsonb, null, 'FDA: Lovely lilies and curious cats, a dangerous combination', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/lovely-lilies-and-curious-cats-dangerous-combination', '2026-10-08'),
('no-dog-flea-products', 'tip', 'parasites', '🐕', 'Never use dog flea products on cats', 'Many dog spot-ons contain permethrin, which cats cannot break down. Even a small amount can be serious, and cats can also pick it up by rubbing against a recently treated dog.', '{}'::jsonb, null, 'International Cat Care: Permethrin poisoning', 'https://icatcare.org/articles/permethrin-poisoning', '2026-10-08'),
('no-human-medicines', 'tip', 'safety', '💊', 'Never give your cat human painkillers', 'Even part of one paracetamol tablet can cause severe poisoning in a cat. Only give medicines prescribed by your vet, and book an appointment if you think your cat is in pain.', '{}'::jsonb, null, 'International Cat Care: Paracetamol poisoning in cats', 'https://icatcare.org/articles/paracetamol-poisoning-in-cats', '2026-10-08'),
('cats-hide-illness', 'fact', 'health', '🫥', 'Cats are good at hiding illness', 'Cats have evolved to hide signs of pain and illness. Early on, the only clue may be that your cat seems quieter and more withdrawn than usual.', '{}'::jsonb, null, 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-appetite-drop', 'hint', 'health', '🍽️', 'You recorded a drop in appetite', 'If your cat has not eaten properly for about 24 hours, VCA advises contacting your veterinarian promptly, as cats that stop eating can develop liver problems.', '{}'::jsonb, 'appetite_drop', 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-quiet-cat', 'hint', 'health', '🫥', 'You noted your cat seems quieter', 'Cats tend to hide pain and illness, and being quiet or withdrawn can be an early sign. If it continues or you notice other changes, it may be worth discussing with your veterinarian.', '{}'::jsonb, 'quiet_cat', 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-litter-change', 'hint', 'health', '🚽', 'You logged a change in litter habits', 'Small, hard stools or smaller urine clumps can be worth discussing with your veterinarian. Straining with little or no urine, especially in a male cat, needs a vet immediately.', '{}'::jsonb, 'litter_change', 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('five-small-meals', 'tip', 'nutrition', '🕔', 'Split the daily ration into small meals', 'Cats naturally eat frequent small meals day and night. International Cat Care suggests dividing the daily ration into at least five portions, using timed or puzzle feeders when you are out.', '{}'::jsonb, null, 'International Cat Care: Feeding your cat or kitten', 'https://icatcare.org/articles/feeding-your-cat-or-kitten', '2026-10-08'),
('weigh-food-adjust', 'tip', 'nutrition', '⚖️', 'Weigh food and adjust to your cat', 'Use the feeding guide on the pack as a starting point, then adjust the daily amount to keep a healthy weight and body condition. Weighing dry food on a kitchen scale is more accurate than a scoop.', '{}'::jsonb, null, 'International Cat Care: Feeding your cat or kitten', 'https://icatcare.org/articles/feeding-your-cat-or-kitten', '2026-10-08'),
('puzzle-feeders', 'tip', 'play', '🧩', 'Turn meals into a puzzle', 'Puzzle feeders make meals last longer and add activity. Start with an easy setting and keep some food in a bowl, then make it harder as your cat gets confident. An egg box with kibble works too.', '{}'::jsonb, null, 'International Cat Care: Puzzle feeders for your cat', 'https://icatcare.org/articles/puzzle-feeders-for-your-cat', '2026-10-08'),
('puzzle-feeders-for-all', 'fact', 'mind', '🧠', 'Puzzle feeders suit almost any cat', 'International Cat Care notes that all cats can use puzzle feeders, including seniors, kittens and cats with disabilities. Benefits it lists include reduced stress and anxiety and support with weight loss.', '{}'::jsonb, null, 'International Cat Care: Puzzle feeders for your cat', 'https://icatcare.org/articles/puzzle-feeders-for-your-cat', '2026-10-08'),
('wsava-raw-statement', 'fact', 'nutrition', '📄', 'What vet bodies say about raw diets', 'The WSAVA Global Nutrition Committee lists risks of home-made raw meat diets including bacterial and parasite contamination, injury or blockage from bones, and thyroid problems from thyroid tissue. It states benefits have not been properly documented.', '{}'::jsonb, null, 'WSAVA Global Nutrition Committee: Statement on risks of raw meat-based diets', 'https://wsava.org/wp-content/uploads/2020/05/WSAVA-Global-Nutrition-Committee-Statement-on-Risks-of-Raw-Meat.pdf', '2026-10-08'),
('brushing-by-coat', 'tip', 'grooming', '🪮', 'Long coats need daily brushing', 'Long-haired breeds such as Persians and Ragdolls need brushing daily. Check the armpits, legs, tummy and tail, which are common spots for mats.', '{"coat": ["long"]}'::jsonb, null, 'PDSA: How often should you groom your pet', 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/grooming-pets', '2026-10-08'),
('brushing-short-coat', 'tip', 'grooming', '🖌️', 'Short coats need a brush a few times a week', 'Medium and short-haired cats such as British Shorthairs and Siamese benefit from brushing a few times a week to remove dead hair.', '{"coat": ["short", "semi-long"]}'::jsonb, null, 'PDSA: How often should you groom your pet', 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/grooming-pets', '2026-10-08'),
('hairless-bathing', 'tip', 'grooming', '🛁', 'Hairless cats need regular baths', 'Without fur to spread skin oils, hairless breeds like the Sphynx need regular bathing with a gentle cat-specific shampoo, sometimes as often as weekly.', '{"coat": ["hairless"]}'::jsonb, null, 'PDSA: How often should you groom your pet', 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/grooming-pets', '2026-10-08'),
('senior-claw-check', 'tip', 'grooming', '💅', 'Check an older cat''s claws regularly', 'Less mobile cats may not scratch enough to wear claws down, and overgrown claws can grow into the pads. If trimming, snip only the clear tip and avoid the pink quick.', '{"life_stage": ["senior"]}'::jsonb, null, 'International Cat Care: Trimming your cat''s claws', 'https://icatcare.org/articles/trimming-your-cats-claws', '2026-10-08'),
('dental-disease-common', 'fact', 'dental', '🦷', 'Dental disease is very common in cats', 'Studies report that between 50 and 90 percent of cats older than four have some form of dental disease. Turning the head oddly while eating, drooling or bad breath can be signs.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feline dental disease', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-dental-disease', '2026-10-08'),
('toothbrushing-four-weeks', 'tip', 'dental', '🪥', 'Build up to toothbrushing over four weeks', 'Start by letting your cat lick cat toothpaste from your finger, then from a brush, then gently brush the outer tooth surfaces. Never use human toothpaste, which is not safe for cats.', '{}'::jsonb, null, 'Cornell Feline Health Center: Feline dental disease', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-dental-disease', '2026-10-08'),
('bcs-check-at-home', 'tip', 'weight', '✋', 'Check body condition with your hands', 'At an ideal score of 5 out of 9, ribs can be felt with a slight fat covering and a waist is visible behind the ribs. If the ribs are hard to feel or there is no waist, ask your vet.', '{}'::jsonb, null, 'WSAVA: Body condition score, cat', 'https://wsava.org/wp-content/uploads/2020/08/Body-Condition-Score-cat-updated-August-2020.pdf', '2026-10-08'),
('slow-weight-loss', 'tip', 'weight', '🐢', 'Weight loss should be slow and vet-guided', 'VCA suggests overweight cats lose about 1 to 2 percent of body weight per week under veterinary supervision. Losing weight too fast can lead to a serious liver condition.', '{}'::jsonb, null, 'VCA Animal Hospitals: Creating a weight reduction plan for cats', 'https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-cats', '2026-10-08'),
('free-feeding-obesity', 'fact', 'weight', '📈', 'Overweight is the most common nutrition problem', 'Obesity is the most common nutritional disorder in cats. A Cornell vet estimates about half of cats seen at clinics are overweight, and identifies leaving dry food out all day as a major cause.', '{}'::jsonb, null, 'Cornell Feline Health Center: Obesity', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/obesity', '2026-10-08'),
('kitten-socialisation-window', 'fact', 'kitten', '🐣', 'Kittens learn about people very early', 'The main socialisation period runs from about two to seven weeks of age. Gentle handling by at least four different people in this window helps kittens grow into confident adults.', '{"life_stage": ["kitten"]}'::jsonb, null, 'Cats Protection: Kitten socialisation', 'https://www.cats.org.uk/help-and-advice/pregnancy-and-kitten-care/kitten-socialisation', '2026-10-08'),
('kitten-food', 'tip', 'kitten', '🍼', 'Kittens need food made for growth', 'Kittens need a diet formulated for their life stage rather than adult food. Weaning usually starts at 3 to 4 weeks and is usually complete by about 8 weeks.', '{"life_stage": ["kitten"]}'::jsonb, null, 'International Cat Care: Feeding your cat or kitten', 'https://icatcare.org/articles/feeding-your-cat-or-kitten', '2026-10-08'),
('kitten-worming', 'tip', 'parasites', '🪱', 'Worm kittens early and often', 'International Cat Care suggests roundworm treatment from 3 weeks of age, every two weeks until 8 weeks, then monthly until 6 months. Your vet can recommend a product and dose.', '{"life_stage": ["kitten"]}'::jsonb, null, 'International Cat Care: Worming your cat', 'https://icatcare.org/articles/worming-your-cat', '2026-10-08'),
('fleas-and-tapeworm', 'fact', 'parasites', '🐜', 'Fleas can pass on tapeworm', 'Cats can pick up a tapeworm by swallowing infected fleas while grooming. International Cat Care advises that if your cat has fleas, assume they also have this tapeworm.', '{}'::jsonb, null, 'International Cat Care: Worming your cat', 'https://icatcare.org/articles/worming-your-cat', '2026-10-08'),
('indoor-cats-vaccines', 'fact', 'vet', '💉', 'Indoor cats still need core vaccines', 'Core vaccines against panleukopenia and cat flu viruses, plus rabies where present, are considered essential for all cats, including indoor-only cats.', '{}'::jsonb, null, 'International Cat Care: Vaccinating your cat', 'https://icatcare.org/articles/vaccinating-your-cat', '2026-10-08'),
('new-cat-slow-intro', 'tip', 'behaviour', '🚪', 'Introduce a new cat slowly', 'Start the newcomer in a room the resident cat does not use, with its own food, water, litter and hiding spots. Swap bedding to mix scents before any visual contact through a gate or screen.', '{}'::jsonb, null, 'International Cat Care: Introducing cats', 'https://icatcare.org/articles/introducing-cats', '2026-10-08'),
('carrier-left-out', 'tip', 'vet', '🧺', 'Leave the carrier out at home', 'A carrier that lives in the home, lined with a soft towel and with treats or toys placed inside, becomes a normal resting place rather than a sign of a trip.', '{}'::jsonb, null, 'VCA Animal Hospitals: Preparing your cat for a trip to the veterinarian', 'https://vcahospitals.com/know-your-pet/preparing-your-cat-for-a-trip-to-the-veterinarian', '2026-10-08'),
('pheromone-spray-carrier', 'tip', 'vet', '🌿', 'Spray the blanket, not the cat', 'If you use a synthetic calming pheromone, spray the blanket or towel in the carrier about 15 minutes before your cat goes in.', '{}'::jsonb, null, 'VCA Animal Hospitals: Preparing your cat for a trip to the veterinarian', 'https://vcahospitals.com/know-your-pet/preparing-your-cat-for-a-trip-to-the-veterinarian', '2026-10-08'),
('cover-carrier-journey', 'tip', 'vet', '🧣', 'Cover the carrier on the way', 'A large towel or sheet over the carrier, leaving enough ventilation, can help your cat stay calm on the journey. Let your cat come out at its own pace once you are home.', '{}'::jsonb, null, 'Cats Protection: How to make vet visits less stressful for your cat', 'https://www.cats.org.uk/cats-blog/how-to-make-vet-visits-less-stressful-for-your-cat', '2026-10-08'),
('clicker-basics', 'tip', 'training', '🔔', 'Start clicker training with click and treat', 'First teach that the click means a reward by clicking and giving a treat straight away. Then click the moment your cat does what you want, and never punish mistakes.', '{}'::jsonb, null, 'Cats Protection: How to clicker train a cat', 'https://www.cats.org.uk/cats-blog/tips-for-clicker-training-cat', '2026-10-08'),
('senior-age-bands', 'fact', 'senior', '🎂', 'When is a cat considered senior', 'International Cat Care describes cats as mature from 7 years, senior from 11 to 14, and super senior from 15 years onwards.', '{}'::jsonb, null, 'International Cat Care: Special considerations for senior cats', 'https://icatcare.org/articles/special-considerations-for-senior-cats', '2026-10-08'),
('senior-low-tray', 'tip', 'senior', '🪜', 'Make life easier for an older cat', 'A litter tray with lower sides is easier for stiff joints. Keep food, water and litter within easy reach, and offer several water bowls, as older cats are at greater risk of dehydration.', '{"life_stage": ["senior"]}'::jsonb, null, 'International Cat Care: Special considerations for senior cats', 'https://icatcare.org/articles/special-considerations-for-senior-cats', '2026-10-08'),
('senior-grooming-pain', 'fact', 'senior', '🦴', 'Less grooming can be a sign of pain', 'In older cats, grooming less than usual may point to long-term pain from arthritis. Stiffness and difficulty jumping are other signs to mention to your vet.', '{"life_stage": ["senior"]}'::jsonb, null, 'International Cat Care: Special considerations for senior cats', 'https://icatcare.org/articles/special-considerations-for-senior-cats', '2026-10-08'),
('hint-new-cat', 'hint', 'behaviour', '🚪', 'You added a new cat to the household', 'A gradual introduction usually goes better: separate rooms first, scent swapping, then short supervised meetings. Settling in can take from several days to a week or two, sometimes longer.', '{}'::jsonb, 'new_cat', 'International Cat Care: Introducing cats', 'https://icatcare.org/articles/introducing-cats', '2026-10-08'),
('hint-vaccine-due', 'hint', 'vet', '💉', 'A vaccination looks due', 'Based on your log, a vaccine may be due. Booster timing depends on the vaccine and your cat''s risk, so it may be worth checking the schedule with your veterinarian.', '{}'::jsonb, 'vaccine_due', 'International Cat Care: Vaccinating your cat', 'https://icatcare.org/articles/vaccinating-your-cat', '2026-10-08'),
('hint-parasite-due', 'hint', 'parasites', '🐜', 'Parasite treatment looks due', 'Based on your log, a flea or worm treatment may be due. Use only cat products at the dose your vet recommends, never dog flea treatments.', '{}'::jsonb, 'parasite_due', 'International Cat Care: Worming your cat', 'https://icatcare.org/articles/worming-your-cat', '2026-10-08'),
('hint-vet-visit-soon', 'hint', 'vet', '📅', 'Vet visit coming up', 'Get the carrier out a few days early with a familiar blanket inside, and write down your questions with the most important first. Your PawLog history can help you describe recent changes.', '{}'::jsonb, 'vet_visit_soon', 'Cats Protection: How to make vet visits less stressful for your cat', 'https://www.cats.org.uk/cats-blog/how-to-make-vet-visits-less-stressful-for-your-cat', '2026-10-08'),
('hint-overweight', 'hint', 'weight', '⚖️', 'Your cat''s weight is above its target', 'You recorded a weight above the target range. If weight loss is planned, a gradual 1 to 2 percent per week under veterinary guidance is generally recommended.', '{}'::jsonb, 'overweight', 'VCA Animal Hospitals: Creating a weight reduction plan for cats', 'https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-cats', '2026-10-08'),
('hint-bcs-high', 'hint', 'weight', '✋', 'You recorded a high body condition score', 'A score above 5 out of 9 means ribs are harder to feel and the waist is less visible. This may be worth discussing with your veterinarian before changing food amounts.', '{}'::jsonb, 'bcs_high', 'WSAVA: Body condition score, cat', 'https://wsava.org/wp-content/uploads/2020/08/Body-Condition-Score-cat-updated-August-2020.pdf', '2026-10-08'),
('hint-bcs-low', 'hint', 'weight', '🦴', 'You recorded a low body condition score', 'A score below 4 out of 9 means ribs and spine are easily felt with little fat covering. This may be worth discussing with your veterinarian.', '{}'::jsonb, 'bcs_low', 'WSAVA: Body condition score, cat', 'https://wsava.org/wp-content/uploads/2020/08/Body-Condition-Score-cat-updated-August-2020.pdf', '2026-10-08'),
('pill-in-soft-food', 'tip', 'health', '💊', 'Try hiding a pill in a little soft food', 'A small amount of wet food or a soft treat moulded around the pill is often the easiest method. Offer it when your cat is hungry and watch that it is not spat out.', '{}'::jsonb, null, 'VCA Animal Hospitals: Giving pills to cats', 'https://vcahospitals.com/know-your-pet/giving-pills-to-cats', '2026-10-08'),
('ask-about-liquid-meds', 'tip', 'vet', '🧪', 'Ask about other forms of medication', 'If pilling is a struggle, ask your vet whether a medicine can be compounded into a flavoured liquid or treat. Some can even be made into a gel that is rubbed on the ear flap.', '{}'::jsonb, null, 'VCA Animal Hospitals: Giving pills to cats', 'https://vcahospitals.com/know-your-pet/giving-pills-to-cats', '2026-10-08'),
('clicker-short-patient', 'tip', 'training', '🎓', 'Train when your cat is relaxed and keep it short', 'Pick a time when your cat is calm but alert, and end the session when the treats run out. Progress can take days to months, so patience matters more than speed.', '{}'::jsonb, null, 'Cats Protection: How to clicker train a cat', 'https://www.cats.org.uk/cats-blog/tips-for-clicker-training-cat', '2026-10-08'),
('clicker-muffle', 'tip', 'training', '🤫', 'Muffle the clicker at first', 'Some cats are startled by the sound, so muffle the clicker in a pocket or sleeve to begin with. If you click at the wrong moment, still give the treat.', '{}'::jsonb, null, 'Cats Protection: How to clicker train a cat', 'https://www.cats.org.uk/cats-blog/tips-for-clicker-training-cat', '2026-10-08'),
('weigh-at-home', 'tip', 'weight', '📏', 'Weigh your cat at home', 'Regular weigh-ins help you notice gradual changes. During a weight loss plan, VCA suggests weighing at least every other week so the food amount can be adjusted.', '{}'::jsonb, null, 'VCA Animal Hospitals: Creating a weight reduction plan for cats', 'https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-cats', '2026-10-08'),
('weekly-once-over', 'tip', 'health', '🔍', 'Give your cat a regular once-over', 'Regularly checking your cat from nose to tail helps you learn what is normal and spot small problems early, such as subtle weight loss you can feel over the ribs and spine.', '{}'::jsonb, null, 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-no-weight-30d', 'hint', 'weight', '⚖️', 'No weight logged for a month', 'Regular weigh-ins make gradual changes easier to spot. Cornell notes that a baby scale can be used to weigh a cat at home.', '{}'::jsonb, 'no_weight_30d', 'Cornell Feline Health Center: Obesity', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/obesity', '2026-10-08'),
('hint-weight-gain', 'hint', 'weight', '📈', 'You recorded a weight increase', 'Free access to dry food is a common cause of weight gain. Measured, scheduled meals can help, and the change may be worth discussing with your veterinarian.', '{}'::jsonb, 'weight_gain', 'Cornell Feline Health Center: Obesity', 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/obesity', '2026-10-08'),
('hint-weight-drop', 'hint', 'weight', '📉', 'You recorded a weight drop', 'Unplanned weight loss in cats can be slow and subtle, and sudden loss can have medical causes. It may be worth discussing with your veterinarian.', '{}'::jsonb, 'weight_drop', 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-underweight', 'hint', 'weight', '🦴', 'Your cat''s weight is below its target', 'You recorded a weight below the target range. Weight loss is one of the reasons International Cat Care gives for a vet check, so it may be worth discussing with your veterinarian.', '{}'::jsonb, 'underweight', 'International Cat Care: Special considerations for senior cats', 'https://icatcare.org/articles/special-considerations-for-senior-cats', '2026-10-08'),
('hint-no-grooming-14d', 'hint', 'grooming', '🪮', 'No grooming logged for two weeks', 'Long coats need daily brushing and short coats a few times a week. A coat that looks greasy, matted or unkempt can mean a cat is grooming less, which may be worth mentioning to your veterinarian.', '{}'::jsonb, 'no_grooming_14d', 'VCA Animal Hospitals: Recognizing the signs of illness in cats', 'https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats', '2026-10-08'),
('hint-symptom-repeat', 'hint', 'health', '📝', 'You logged the same symptom more than once', 'Repeated symptoms may be worth discussing with your veterinarian. Writing your questions down before the visit, most important first, can help you cover everything.', '{}'::jsonb, 'symptom_repeat', 'Cats Protection: How to make vet visits less stressful for your cat', 'https://www.cats.org.uk/cats-blog/how-to-make-vet-visits-less-stressful-for-your-cat', '2026-10-08'),
('hint-missed-medication', 'hint', 'health', '⏰', 'You marked a dose as missed', 'Ask your veterinarian or pharmacist what to do about a missed dose. If giving pills is difficult, they may be able to suggest a liquid, treat or gel form.', '{}'::jsonb, 'missed_medication', 'VCA Animal Hospitals: Giving pills to cats', 'https://vcahospitals.com/know-your-pet/giving-pills-to-cats', '2026-10-08'),
('hint-growing', 'hint', 'kitten', '🌱', 'Your kitten is still growing', 'You recorded a kitten weight. Growing kittens need a food formulated for kittens, and the pack guide is a starting point to adjust as body condition changes.', '{"life_stage": ["kitten"]}'::jsonb, 'growing', 'International Cat Care: Feeding your cat or kitten', 'https://icatcare.org/articles/feeding-your-cat-or-kitten', '2026-10-08')
on conflict (code) do update set kind = excluded.kind, topic = excluded.topic, icon = excluded.icon, title = excluded.title,
  body = excluded.body, audience = excluded.audience, trigger = excluded.trigger, source = excluded.source,
  source_url = excluded.source_url, reviewed = excluded.reviewed, active = true;

insert into knowledge_articles (slug, category, icon, title, summary, read_minutes, body_md, audience, urgent, sources, sort_order, reviewed) values
('wet-dry-or-raw-choosing-a-diet', 'food', '🥣', 'Wet, dry or raw: choosing a diet', 'How wet, dry and raw diets compare on water, calories and safety, and how to read a pet food label with confidence.', 4, '## Start with the label

The most useful line on a pet food pack is the nutritional adequacy statement. It tells you whether the food is **complete**, meaning it supplies every nutrient a cat needs, and which life stage it was made for. In the US this statement refers to AAFCO nutrient profiles. In Europe it refers to FEDIAF guidelines.

Foods labelled complementary, intermittent or for short-term feeding are not meant to be the whole diet. WSAVA suggests keeping them to a small share of daily food, around a tenth, unless your vet has advised otherwise.

Words such as premium or holistic are not regulated, so they tell you little about nutrition. The ingredient list on its own is also a weak guide to quality.

## Questions worth asking a brand

The WSAVA Global Nutrition Committee suggests asking pet food makers:

- Do they employ a qualified nutritionist, and who formulates the recipes?
- What quality control do they run on ingredients and finished food?
- Have they done or published any nutrition research?
- Can they tell you the calories per can, pouch or cup?

If a company cannot answer, WSAVA advises caution with that brand.

## Wet food

Canned food is at least 75% water, according to Cornell Feline Health Center. That makes it a good source of fluid for cats, who often drink little. Most cats find it very tasty. It costs more, and opened cans need to go in the fridge.

## Dry food

Dry food holds only about 6 to 10% water. It is cheaper, keeps well in the bowl and is very energy dense. Because a small scoop carries a lot of calories, weighing dry food helps you avoid overfeeding. Fresh water should always be available.

## Mixed feeding

International Cat Care suggests that healthy cats often do well on a mix of wet and dry. This gives some benefits of each and means your cat is not used to only one texture, which can help if a diet change is ever needed.

## Raw diets

Raw diets are popular, but the evidence points to real risks. WSAVA states there is no evidence that raw meat based diets offer health benefits over complete commercial or balanced home-cooked diets.

- **Bacteria.** Raw meat can carry Salmonella, Listeria, E. coli and Campylobacter. When the FDA tested pet foods, raw products were more likely than other types to contain disease-causing bacteria.
- **Risk to people.** Handling raw food or the cat''s litter can spread these germs in the home. Young children, older people, pregnant people and anyone with a weak immune system are most at risk.
- **Freezing does not make it safe.** Freezing, dehydrating or freeze-drying do not kill all bacteria.
- **Balance.** Home-made diets, raw or cooked, can lack or overload key nutrients. This matters most for growing kittens.

If you do feed raw, the FDA advises washing hands well, cleaning surfaces and bowls, thawing food in the fridge and avoiding face licks after meals.

## Talk to your vet

Every cat is different. Your veterinarian can help you pick a diet that suits your cat''s age, weight and health, especially if your cat has a medical condition.', '{}'::jsonb, false, '[{"name": "WSAVA: Guidelines on Selecting Pet Foods", "url": "https://wsava.org/wp-content/uploads/2021/04/Selecting-a-pet-food-for-your-pet-updated-2021_WSAVA-Global-Nutrition-Toolkit.pdf"}, {"name": "WSAVA: Raw Meat Based Diets for Pets", "url": "https://wsava.org/wp-content/uploads/2021/04/Raw-Meat-Based-Diets-for-Pets_WSAVA-Global-Nutrition-Toolkit.pdf"}, {"name": "FDA: Get the Facts! Raw Pet Food Diets can be Dangerous to You and Your Pet", "url": "https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-raw-pet-food-diets-can-be-dangerous-you-and-your-pet"}, {"name": "Cornell Feline Health Center: Feeding Your Cat", "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat"}, {"name": "International Cat Care: Feeding your cat or kitten", "url": "https://icatcare.org/articles/feeding-your-cat-or-kitten"}]'::jsonb, 1, '2026-10-08'),
('feeding-routines-that-work', 'food', '⏰', 'Feeding routines that work', 'Portion sizes, meal timing, food puzzles, safe diet changes and water tips for kittens, adults and seniors.', 4, '## Measure, do not guess

The feeding guide on the pack is a starting point, not a rule. Dry food packs a lot of energy into a small scoop, so International Cat Care suggests weighing it on kitchen scales rather than using a cup.

Your cat''s shape tells you whether the amount is right. Ask your vet to show you how to body condition score your cat, then weigh and score at home every few weeks. If your cat gains or loses weight, talk to your vet about adjusting portions rather than changing the amount on your own for weeks.

Treats count too. Keep them to a small share of daily food and trim meals to make room.

## Little and often

In the wild, cats eat many small meals across the day and night. International Cat Care suggests several small portions over 24 hours where your routine allows. Leaving a full bowl down all day can lead to overeating and weight gain.

Set meal times have another benefit. You notice quickly if your cat leaves food, and a drop in appetite can be an early sign of illness.

## Make food a game

A 2016 review in the Journal of Feline Medicine and Surgery by Dantas and colleagues describes food puzzles as a way to support both body and mind. They come in two main types:

- **Mobile puzzles** such as balls or tubes that release kibble when rolled.
- **Stationary puzzles** with wells or channels that a cat paws food out of or licks wet food from.

You can also make simple ones from egg boxes, toilet roll tubes or an ice cube tray.

Start easy. Fill the puzzle generously, scatter a few pieces around it and offer it when your cat is hungry. Keep the usual bowl nearby at first. Make it harder only once your cat is confident, because a puzzle that is too hard causes frustration. In homes with several cats, give each cat its own puzzle.

## Changing food slowly

Sudden switches can upset the stomach or put a cat off eating. A handout shared by the AAFP suggests changing over 7 to 10 days, and longer for fussy cats:

- Offer the new food in a separate dish next to the usual one.
- If your cat eats it, gradually give more new food and less old food each day.
- If your cat is reluctant, slow down. Sniffing the new food is progress.

If your vet has prescribed a diet, follow their plan for introducing it.

## Kittens and seniors

**Kittens** grow fast and need a food made for kittens, fed as several small meals.

**Older cats** change. VCA notes that cats often gain weight in middle age, while some older seniors lose weight and muscle and need more calories. Splitting food into two to four meals and weighing your cat regularly helps you spot changes early. Ask your vet how much to feed at each stage.

## Water matters

Cats often drink little, so make water easy and appealing:

- Offer several bowls in quiet spots, away from food and the litter tray.
- Many cats prefer wide glass, ceramic or metal bowls to plastic.
- A water fountain suits cats that like moving water. Clean it and change the filter as the maker directs.
- Wet food adds extra fluid to the diet.

If you notice your cat drinking much more or less than usual, contact your veterinarian.', '{}'::jsonb, false, '[{"name": "Journal of Feline Medicine and Surgery (Dantas et al. 2016): Food puzzles for cats: Feeding for physical and emotional wellbeing", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11148901/"}, {"name": "International Cat Care: Feeding your cat or kitten", "url": "https://icatcare.org/articles/feeding-your-cat-or-kitten"}, {"name": "AAFP (catvets.com): Changing Your Cat''s Food", "url": "https://catvets.com/wp-content/uploads/2025/09/CCC-Changing-Your-Cats-Food.pdf"}, {"name": "VCA Animal Hospitals: Feeding Mature, Senior, and Geriatric Cats", "url": "https://vcahospitals.com/know-your-pet/feeding-mature-senior-and-geriatric-cats"}, {"name": "VCA Animal Hospitals: How To Get Your Cat To Drink More Water", "url": "https://vcahospitals.com/resources/preventive-cat/nutrition/tips-to-encourage-cats-to-drink-more-water"}]'::jsonb, 2, '2026-10-08'),
('play-like-a-hunter', 'play', '🪶', 'Play like a hunter', 'Use your cat''s natural hunting sequence to plan short, satisfying play sessions that end with a catch and a reward.', 3, '## Why hunting matters

Even a well-fed pet cat keeps the instincts of a hunter. International Cat Care describes a hunting sequence that runs from searching and stalking, through the chase and pounce, to the catch and finally eating. Pet cats rarely get to finish the whole sequence, and play is a safe way to let them.

Good play follows the same steps:

- **Stalk.** The toy hides, peeks out and moves slowly.
- **Chase.** It darts away in quick, jerky bursts.
- **Pounce.** It pauses long enough for your cat to leap.
- **Catch.** Your cat gets to grab and bite it.
- **Eat.** A small treat or a meal closes the game.

## Use a wand toy

A wand or fishing-rod toy keeps your hands out of the way and lets you move the toy like real prey. Toys that look and feel like a mouse, bird or insect tend to hold attention best. Move it along the floor, behind furniture and in the air, the way small animals move.

Keep your hands and feet out of the game. Kittens taught to chase fingers can grow into adults that scratch and bite people. Save hands for stroking.

When play is over, put wand toys away out of reach. Cats can swallow or get tangled in string.

## Keep it short and frequent

Cats hunt in short bursts, not long marathons. Several brief sessions a day work better than one long one. A session can be a couple of minutes for an older cat or up to around 10 to 15 minutes for a young, active one. Stop when your cat loses interest, and never force play.

Dawn and dusk are when cats are naturally most active, so morning and evening sessions are often the most successful.

## End with a catch

Every game should finish with success. If the prey always escapes, your cat can become frustrated, and some cats then pounce on ankles instead. Slow the toy down near the end, let your cat catch it and enjoy the win.

Then wind down gently. Offering a treat or a meal right after play completes the hunt and helps your cat settle.

## A note on laser pointers

Laser pointers get cats moving, but there is nothing to catch. International Cat Care suggests switching to a wand toy before the end so the game finishes with a real catch. PDSA advises against relying on lasers for this reason. If you use one, never shine it into your cat''s eyes, and always finish with a toy your cat can grab.

## Signs your cat enjoyed it

A cat that has had a good hunt often grooms, eats and then rests. If your cat seems restless, wound up or starts ambushing you after play, try shorter sessions with a clearer catch and a treat at the end.

If your cat suddenly stops wanting to play, it may be a sign of pain or illness, so check in with your veterinarian.', '{}'::jsonb, false, '[{"name": "International Cat Care: Playing with your cat", "url": "https://icatcare.org/articles/playing-with-your-cat"}, {"name": "International Cat Care: Understanding the hunting behaviour of cats", "url": "https://icatcare.org/articles/understanding-the-hunting-behaviour-of-cats"}, {"name": "VCA Animal Hospitals: Cat Behavior and Training: Play and Play Toys", "url": "https://vcahospitals.com/know-your-pet/cat-behavior-and-training---play-and-play-toys"}, {"name": "PDSA: Exercising your Cat", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/kittens-cats/exercise-for-your-cat"}, {"name": "Cats Protection: Cats and play", "url": "https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-play"}]'::jsonb, 1, '2026-10-08'),
('games-and-enrichment-at-home', 'play', '📦', 'Games and enrichment at home', 'Simple ways to keep an indoor cat busy and content: food games, boxes, scent, toy rotation and play in multi-cat homes.', 4, '## Why enrichment matters

Cats need chances to hunt, explore, climb, hide and scratch. Indoor cats in particular can get bored without them. Enrichment simply means giving your cat things to do that match these natural needs. Most ideas cost little or nothing.

## Food games

A cat''s urge to hunt is not driven by hunger, so even well-fed cats enjoy working for food.

- **Puzzle feeders.** Serve part of a meal in a puzzle toy. A plastic bottle with a few smooth holes cut in it works as a homemade version.
- **Several small dishes.** Split a meal between bowls in different rooms so your cat has to move around.
- **Hide and seek.** Hide a few treats or part of the daily food in different spots. Start with easy places and make them harder over time.

Count food used in games as part of the daily ration so your cat does not gain weight.

## Boxes and hideaways

Cats love to climb and hide. A simple cardboard box is a cheap alternative to a shop-bought activity centre. Try a few boxes in different rooms and swap them out when they lose their novelty.

High places matter as well. Shelves, cat trees and a window perch with a view give your cat somewhere to watch the world and rest in safety.

## Scent enrichment

Smell is a big part of how cats experience the world. Familiar scents can be calming, and new ones can be exciting.

- **Catnip.** Many cats enjoy toys stuffed with dried catnip, though not all respond.
- **Other plants.** In a 2017 study of 100 cats by Bol and colleagues, about 79% responded to silver vine and 68% to catnip. Many cats that ignored catnip still reacted to silver vine. Tatarian honeysuckle and valerian root also drew responses in around half the cats.
- **Scratching posts.** Scratching leaves scent marks that help cats feel at home, so place posts where your cat spends time.

Offer scent toys for short periods and watch how your cat reacts.

## Rotate toys

Toys lose their appeal when they are always out. Keep a small number available and swap them every few days or weekly. An old toy that has been away for a while can feel new again. Check toys for wear and replace any that are falling apart.

Put away anything with string, ribbon or small parts after play, since these can be swallowed.

## Play in multi-cat homes

Cats in the same home do not always want to play together. International Cat Care suggests thinking about each cat''s own motivation and giving some cats one-to-one play away from the others.

- Spread food, water, beds, litter trays and scratching posts around the home so each cat can reach them without passing others.
- Offer boxes, shelves and hiding spots so cats can join in from different angles or opt out.
- If play turns rough, distract with a wand toy. If fighting carries on, talk to your vet.

## Little and often

You do not need a big routine. A few short play sessions a day, a food game at breakfast and a fresh box at the weekend can make a real difference to an indoor cat.', '{}'::jsonb, false, '[{"name": "VCA Animal Hospitals: Cat Behavior and Training: Enrichment for Indoor Cats", "url": "https://vcahospitals.com/know-your-pet/cat-behavior-and-training---enrichment-for-indoor-cats"}, {"name": "International Cat Care: Playing with your cat", "url": "https://icatcare.org/articles/playing-with-your-cat"}, {"name": "Cats Protection: Cats and play", "url": "https://www.cats.org.uk/help-and-advice/cat-behaviour/cats-and-play"}, {"name": "BMC Veterinary Research (Bol et al. 2017): Responsiveness of cats to silver vine, Tatarian honeysuckle, valerian and catnip", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5356310"}, {"name": "FelineVMA (catvets.com): Setting Up the Environment for Success", "url": "https://catvets.com/resource/setting-up-for-success/"}]'::jsonb, 2, '2026-10-08'),
('how-cats-learn', 'training', '🎓', 'How cats learn', 'How cats learn through rewards, markers and short sessions, and why punishment backfires.', 4, '## Cats are always learning

Cats learn all the time, even when they seem to be dozing. They notice what happens before and after events and link them together. A cat that hears the treat bag rustle and comes running has learned something. So has a cat that hides when the carrier comes out.

The Feline Veterinary Medical Association (FelineVMA, formerly the AAFP) describes two main ways this happens:

- **Linking events.** A cat learns that one thing predicts another, such as the cupboard opening before dinner.
- **Linking actions to results.** A cat learns that its own behaviour leads to an outcome. If sitting by the bowl earns a treat, sitting happens more often.

## Reward what you want

Positive reinforcement means adding something your cat likes right after a behaviour, so the behaviour is repeated. FelineVMA recommends it as the method to use for all training.

Rewards do not have to be food. In one study described by FelineVMA, half of cats preferred social contact such as petting or play, while 37% preferred food. Try a few options and see what your cat chooses on the day. Good choices include:

- Small, soft treats your cat can eat quickly
- A few seconds of play with a favourite toy
- Gentle stroking around the cheeks or head
- Kind words in a soft voice

## Timing matters

The reward has to arrive straight after the behaviour, ideally within a few seconds. Otherwise your cat may link it to whatever it did next.

A **marker** helps. This is a sound or word, such as a click or a short word like yes, that you pair with a treat until your cat expects a reward each time it hears it. The marker then pinpoints the exact moment your cat got it right, even if the treat takes a second to arrive.

To start with a clicker, click once at a soft volume and give a treat straight away. Repeat until your cat looks for the treat when it hears the click. Always follow a click with a reward, even if you clicked by mistake. Some cats dislike the sound, so muffle it in a pocket or use a word instead.

## Keep sessions short

Cats have short attention spans. FelineVMA suggests several sessions of 5 to 10 minutes a day rather than one long block. Stop if you or your cat become distracted or frustrated, and try to finish on an easy success.

Choose a time when your cat is relaxed but awake, in a quiet room. Work on one goal at a time. Count training treats as part of daily food.

## Why punishment does not work

Shouting, squirt bottles and physical punishment are not recommended. They can make a cat fearful, damage your bond and lead to scratching, biting or hiding. A frightened cat also learns less, and may refuse even a favourite treat.

Instead, ignore or redirect unwanted behaviour, and reward the behaviour you would like to see. If your cat scratches the sofa, offer a sturdy post nearby and reward its use.

## Health affects learning

Pain and illness make it harder for cats to learn. Do not train a cat that is unwell, sore or frightened. If your cat suddenly struggles, or its behaviour changes, contact your veterinarian.', '{}'::jsonb, false, '[{"name": "FelineVMA (catvets.com): Positive Reinforcement Training Educational Toolkit", "url": "https://catvets.com/wp-content/uploads/2026/01/Positive-Reinforcement-Training-Educational-Toolkit_Complete.pdf"}, {"name": "FelineVMA (catvets.com): How Cats Learn", "url": "https://catvets.com/resource/how-cats-learn/"}, {"name": "FelineVMA (catvets.com): Positive Reinforcement of Cats position statement", "url": "https://catvets.com/resource/positive-reinforcement-of-cats-position-statement/"}, {"name": "Cats Protection: Tips for clicker training a cat", "url": "https://www.cats.org.uk/cats-blog/tips-for-clicker-training-cat"}, {"name": "VCA Animal Hospitals: The power of positive training", "url": "https://vcahospitals.com/pediatric/kitten/behavior-training/how-to-train-a-kitten"}]'::jsonb, 1, '2026-10-08'),
('carrier-handling-and-tricks', 'training', '🧳', 'Carrier, handling and tricks', 'Step-by-step ways to teach your cat to like the carrier, accept handling and tablets, and learn sit, high five and come.', 5, '## Before you start

All of these skills use the same approach: small steps, a reward your cat really likes and short sessions of a few minutes. Work on one goal at a time. Stop before your cat loses interest, and never force or punish. If your cat seems sore or unwell, pause training and contact your veterinarian.

## Teaching your cat to like the carrier

Many cats first meet a carrier on the day they leave their mother, so it quickly becomes linked with stress. PDSA suggests building a new, happier link with food, comfort and safety.

- **Leave it out.** Keep the carrier open in a room you use often, not stored away until vet day.
- **Make it easy.** If your cat avoids it, take the top half off if the design allows. Add soft bedding.
- **Start at a distance.** Scatter treats and place the food bowl at a distance your cat is happy with.
- **Move closer slowly.** Over a few days, move the food nearer, then just inside, then further in.
- **Reward choices.** When your cat steps in without food there, toss a small treat.
- **Rebuild and repeat.** Put the top back on and leave the carrier somewhere quiet so your cat can rest in it. Later, practise with the carrier in the car.

FelineVMA also suggests teaching your cat to touch a target, such as a chopstick, with its nose. You can then guide your cat into the carrier or onto a scale with the target.

## Getting used to handling

Vets and groomers need to touch paws, open mouths and look in ears. FelineVMA calls this cooperative care. Practise at home when your cat is relaxed.

- Touch one area briefly, such as a paw, then reward straight away.
- Slowly build up the time and add gentle pressure, as long as your cat stays calm.
- Work towards lifting a paw, looking at teeth or holding a leg out.
- Back off a step if your cat tenses, flicks its tail or pulls away.

## Tablets and medicine

Always follow your vet''s instructions for any medicine. PDSA notes that some tablets must be swallowed whole or given on an empty stomach, so ask your vet before hiding a tablet in food or crushing it.

- A towel wrapped around the body can keep front paws out of the way.
- Give a reward after every dose so medicine time becomes less of an ordeal.
- Ask your vet or vet nurse to show you how to give a tablet or use a pill giver.
- If your cat is hard to pill, ask whether a liquid or spot-on form exists.

## Simple tricks

Tricks are a fun way to bond and keep your cat''s mind busy. Cats Protection lists sit, high five, lie down and roll over among the tricks many cats can learn with clicker training.

- **Sit.** Wait for your cat to sit on its own, then mark and reward. Once it happens often, say sit as your cat sits, and later just before.
- **High five.** Hold a treat just above your cat''s head. Reward any small lift of a paw, then wait for a higher lift before rewarding.
- **Come when called.** International Cat Care suggests calling your cat''s name with a word such as come, then giving a favourite treat when it arrives. PDSA advises rewarding every time your cat comes to you.

## Be patient

Some cats pick up a new skill in days, others take weeks or months. Keep sessions fun and end on a success.', '{}'::jsonb, false, '[{"name": "FelineVMA (catvets.com): Positive Reinforcement Training Educational Toolkit", "url": "https://catvets.com/wp-content/uploads/2026/01/Positive-Reinforcement-Training-Educational-Toolkit_Complete.pdf"}, {"name": "PDSA: Teaching your cat to love their carrier", "url": "https://www.pdsa.org.uk/media/9201/getting-cats-used-to-carriers.pdf"}, {"name": "PDSA: How To Give Your Cat A Pill", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/how-to-give-your-pet-a-tablet"}, {"name": "Cats Protection: Tips for clicker training a cat", "url": "https://www.cats.org.uk/cats-blog/tips-for-clicker-training-cat"}, {"name": "International Cat Care: Letting your cat or kitten outside for the first time", "url": "https://icatcare.org/articles/letting-your-cat-or-kitten-outside-for-the-first-time"}]'::jsonb, 2, '2026-10-08'),
('when-to-call-the-vet-right-away', 'first-aid', '🚨', 'When to call the vet right away', 'Red flag signs that need a vet straight away, plus common household poisons such as lilies, human painkillers and dog flea products.', 4, '## If in doubt, call

Cats often hide illness until it is serious. If something seems wrong, phone your vet or the nearest emergency clinic. Calling ahead lets the team give first aid advice and get ready for you. This guide cannot diagnose your cat. It helps you decide when not to wait.

## Red flags: call now

Contact a vet straight away if your cat shows any of these signs.

- **Straining in the litter tray with little or no urine.** This is most common in male cats and can mean a blockage. VCA calls a lack of urination a life-threatening emergency, as kidney failure can follow.
- **Breathing problems.** Open-mouth breathing, panting or laboured breathing is not normal in a cat and needs a vet immediately.
- **Collapse or unconsciousness.** Always treat collapse as an emergency.
- **Seizures.** Get help at once if a seizure lasts more than five minutes or if several happen close together.
- **Bleeding that will not stop.** Apply firm pressure with a clean pad and go straight to the clinic.
- **Suspected poisoning.** Signs can include drooling, vomiting, wobbliness, twitching or collapse. Bring the packet, plant or a photo with you.
- **Not eating for 24 hours.** VCA advises urgent vet attention if your cat has not eaten properly for a day.
- **Repeated vomiting or diarrhoea.** Call if it lasts beyond 6 to 12 hours, contains blood, or your cat becomes weak or less responsive.
- **Trauma or falls.** After a road accident, fall or fight, your cat should be checked even if it seems fine, as internal injuries are not always visible.
- **Eye injuries and sudden blindness.** Bumping into things or very wide pupils need prompt care.

## Never give human medicines

Do not give your cat any medicine meant for people unless your vet has prescribed it. Cats process many drugs very differently from humans.

- **Paracetamol (acetaminophen)** is highly toxic to cats. VCA warns that a single tablet can be toxic.
- **Ibuprofen and similar anti-inflammatories** can cause serious harm, including stomach and kidney damage.

Keep all medicines shut away. If your cat swallows any medicine, call your vet or a pet poison line immediately.

## Lilies are deadly

True lilies and daylilies, such as Easter, tiger, Asiatic, Oriental and stargazer lilies, can cause fatal kidney failure in cats. The FDA states that every part of the plant is toxic, including the pollen and the water in the vase. Licking a little pollen off fur can be enough.

Early signs include vomiting, drooling, low energy and loss of appetite. Call your vet at once if you think your cat has touched a lily, even if it seems well. Treatment works best when it starts early, and delays of 18 hours or more often lead to lasting kidney damage. The safest choice is to keep lilies out of homes with cats.

## Dog flea products

Many spot-on flea treatments for dogs contain permethrin. International Cat Care explains that a cat''s liver cannot break it down, so even a small amount can cause tremors, twitching and seizures. Cats can also be poisoned by rubbing against a recently treated dog.

- Only use products labelled for cats.
- Read labels carefully, as packs can look alike.
- If you also have a dog, ask your vet about a flea product without permethrin.

If your cat may have been exposed, contact your vet immediately.', '{}'::jsonb, true, '[{"name": "VCA Animal Hospitals: Emergencies in Cats", "url": "https://vcahospitals.com/know-your-pet/emergencies-in-cats"}, {"name": "VCA Animal Hospitals: Recognizing the Signs of Illness in Cats", "url": "https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats"}, {"name": "VCA Animal Hospitals: Are over-the-counter medications safe for my cat?", "url": "https://vcahospitals.com/resources/conditions-cat/medications/are-over-the-counter-medications-safe-for-my-cat"}, {"name": "FDA: Lovely Lilies and Curious Cats: A Dangerous Combination", "url": "https://www.fda.gov/animal-veterinary/animal-health-literacy/lovely-lilies-and-curious-cats-dangerous-combination"}, {"name": "International Cat Care: Permethrin Poisoning", "url": "https://icatcare.org/articles/permethrin-poisoning"}]'::jsonb, 1, '2026-10-08'),
('first-steps-when-your-cat-seems-unwell', 'first-aid', '🩹', 'First steps when your cat seems unwell', 'What to do in the first minutes: stay safe, handle gently, keep your cat calm, record what you see and travel to the vet safely.', 4, '## Stay calm and stay safe

Take a breath and look around before you act. Check for hazards to you and your cat, such as traffic or spilled chemicals. You cannot help your cat if you get hurt.

Even the gentlest cat may bite or scratch when frightened or in pain. Approach slowly and speak softly. If you can, close doors so your cat stays in one room.

## Call your vet early

Phone your vet or the nearest emergency clinic as soon as possible. They can give advice over the phone and get ready for your arrival. It helps to know in advance where your local out-of-hours clinic is.

## Handle gently with a towel

A thick towel is one of the most useful things you can have.

- Lay it gently over your cat and wrap the body to protect yourself from claws.
- Keep the towel loose around the neck and chest so breathing is not restricted.
- If the neck or back looks hurt, keep your cat as still as you can until you have spoken to your vet.
- To lift, slide your cat onto a towel or blanket, support the head and body, and move slowly without jolting.

During a seizure, do not wrap or hold your cat. Keep your hands away from the mouth and move objects out of the way instead.

## Keep your cat quiet and warm

Limit movement, especially after a fall or injury. A quiet, dim room helps. Keep your cat warm with a blanket, unless it may have heatstroke. In that case your vet will advise on cooling.

## Note what you see

Your observations help the vet team.

- Write down when the signs started and what you noticed.
- During a seizure, start a timer and take a video if it is safe to do so.
- If you suspect poisoning, take the packet, plant or product with you, or a photo of it.

## What not to do

- **Do not give human medicines.** Painkillers such as paracetamol and ibuprofen can be extremely toxic to cats.
- **Do not make your cat vomit** or try to treat a poisoning yourself unless a vet tells you to.
- **Do not force food or water.**
- **Do not put your hand in the mouth** of a conscious or seizing cat.
- **Do not bandage a limb** you think may be broken. Support it and let the vet assess it.

## Travelling to the vet

Use a sturdy carrier or a strong cardboard box lined with a blanket. If your cat is injured, take the top off the carrier and lower your cat in. Do not push an injured cat through a small door.

Keep the carrier level and drive gently. A cat that already knows and trusts its carrier will usually find the trip less stressful.

## A simple first-aid kit

Keep these in one place and tell everyone at home where they are:

- Your vet and out-of-hours clinic phone numbers
- A thick towel and a thermal blanket
- Bandages and non-stick absorbent dressings
- Gauze swabs and sterile saline
- Blunt-ended scissors
- Disposable gloves
- A sturdy cat carrier

First aid only buys time. Always follow it with a vet check.', '{}'::jsonb, true, '[{"name": "VCA Animal Hospitals: Emergencies in Cats", "url": "https://vcahospitals.com/know-your-pet/emergencies-in-cats"}, {"name": "Cats Protection: Cat First Aid", "url": "https://www.cats.org.uk/help-and-advice/health/cat-first-aid"}, {"name": "PDSA: How to safely move an injured pet", "url": "https://www.pdsa.org.uk/pet-help-and-advice/pet-health-hub/other-veterinary-advice/how-to-safely-move-an-injured-pet"}, {"name": "PDSA: What to do if your pet has a seizure", "url": "https://www.pdsa.org.uk/pet-help-and-advice/pet-health-hub/other-veterinary-advice/first-aid-for-fitsseizures-in-pets"}]'::jsonb, 2, '2026-10-08'),
('a-calmer-vet-visit', 'vet', '🩺', 'A calmer vet visit', 'How to make vet trips less stressful, from carrier habits and travel tips to choosing a Cat Friendly practice.', 4, '## Why vet visits are hard for cats

Cats like routine, familiar smells and a sense of control. A trip to the vet takes all of that away at once: the carrier, the car, new people and the smell of other animals. Stress can build from each step.

Skipping checkups to avoid stress is not the answer. The Feline Veterinary Medical Association (FelineVMA) points out that illness found early is usually easier to treat. The good news is that small changes at home and at the clinic make a real difference.

## Make the carrier part of home

Many people keep the carrier in a cupboard or garage until vet day. Your cat soon learns that the carrier means a stressful trip.

- Keep the carrier out in a room your cat likes, with the door open.
- Put a soft blanket or bed inside, along with a piece of clothing that smells of you.
- Add treats or toys so your cat chooses to go in.
- Choose a sturdy, easy-to-clean carrier with a top that comes off. Your cat can then stay in the bottom half during the exam.

If your cat must be put in, do it calmly and gently. Never chase your cat around the house. Give yourself plenty of time so you are not rushing.

## Calming scents

Synthetic feline pheromone sprays may help some cats feel more secure. Spray them on the bedding or a towel before travel, not directly on your cat, and let them settle for at least 15 minutes. Keep your cat out of the room while you spray.

## Cover and steady the carrier

- Drape a towel or blanket from home over the carrier so your cat can hide from sights and sounds.
- Carry it from underneath with both arms, not swinging by the handle.
- Secure it in the car. FelineVMA suggests the floor behind the front seats.
- Keep the radio low and talk calmly. Do not open the carrier during the journey.

## Food before the visit

Only withhold food if your vet asks you to. Some clinics suggest a short fast to lower the chance of travel sickness, but a change in routine can also add stress. If your cat drools or vomits in the car, tell your vet.

## Cat Friendly practices

The Cat Friendly Practice programme, created by International Cat Care and run with FelineVMA, recognises clinics that adapt to cats'' needs. Features may include:

- A cat-only waiting area, or the option to wait in your car
- Shelves to keep carriers off the floor
- Cat-only exam rooms and appointment times
- Longer appointments so your cat has time to settle
- Gentle handling, with no scruffing, and freedom for your cat to choose where to sit

If your clinic is not accredited, you can still ask for a quiet spot to wait or to be called straight into the room.

## When stress is still high

For some cats, travel stays frightening even after all this. Your vet may be able to prescribe a calming medicine to give at home before the visit. Never give any medicine or calming product without talking to your vet first. Ask your vet whether this could help your cat.

## Back at home

A cat returning from the vet can smell different, and other cats at home may hiss. Let the returning cat settle in a quiet room first and reintroduce them slowly.', '{}'::jsonb, false, '[{"name": "FelineVMA (catvets.com): Visiting Your Veterinarian: Getting your Cat to the Veterinary Practice", "url": "https://catvets.com/wp-content/uploads/2024/12/FelineVMA_VisitingYourVet_Web.4.pdf"}, {"name": "FelineVMA (catvets.com): You and your Cat Deserve a Cat Friendly Practice", "url": "https://catvets.com/wp-content/uploads/2025/04/FelineVMA_Cat_Friendly_Practice-Web.pdf"}, {"name": "International Cat Care: Taking your cat to the vet", "url": "https://icatcare.org/articles/taking-your-cat-to-the-vet"}, {"name": "VCA Animal Hospitals: Reducing the Stress of Veterinary Visits for Cats", "url": "https://vcahospitals.com/know-your-pet/reducing-the-stress-of-veterinary-visits-for-cats"}]'::jsonb, 1, '2026-10-08'),
('getting-the-most-from-a-vet-appointment', 'vet', '📋', 'Getting the most from a vet appointment', 'What to bring, what to track at home and how often your cat needs a checkup at each life stage.', 4, '## Why regular checkups matter

Cats are good at hiding illness. During a routine checkup your vet can often spot problems before they become painful or harder to treat. You are an important part of this, because you see your cat every day and notice changes the vet cannot see in a short visit.

## How often to go

The 2021 AAHA/AAFP Feline Life Stage Guidelines set out four life stages. The ages are a guide, not fixed rules.

- **Kitten:** birth to 1 year. Several visits in the first months for vaccines and checks, as your vet advises.
- **Young adult:** 1 to 6 years. At least once a year.
- **Mature adult:** 7 to 10 years. At least once a year.
- **Senior:** over 10 years. At least every 6 months.

Cats with ongoing health conditions often need to be seen more often.

## What to bring

A little preparation helps your vet make the most of the time.

- **Health records** from any previous clinic, or ask for them to be sent ahead.
- **A list or photos of everything your cat takes**, including food, treats, supplements, flea and worm treatments and any medicines.
- **Your weight log.** Home weights over time show trends a single visit can miss.
- **A symptom diary.** Note what you have seen, when it started and how often it happens.
- **Photos and videos.** Cats often behave differently at the clinic. A short clip of limping, coughing, odd breathing or a seizure can be very useful.
- **A stool sample**, if your clinic asks for one.
- **Your questions**, written down so you do not forget them.

## What to track at home

The life stage guidelines encourage caregivers to keep a record of their cat''s behaviour in a journal, with photos and video. Useful things to note include:

- Appetite and how much your cat drinks
- Weight and body shape
- Litter tray habits, including stool and urine clump size
- Vomiting, hairballs or diarrhoea
- Grooming, sleep and activity, including at night
- Changes in mobility, such as reluctance to jump
- Changes in mood or how your cat gets on with people and other pets

Small changes can matter, especially in older cats. Call your vet if you notice something new, rather than waiting for the next routine visit.

## Questions worth asking

Topics depend on your cat''s age, but common ones include:

- Is my cat at a healthy weight, and is this the right food for this life stage?
- What parasite prevention suits my cat''s lifestyle?
- How are my cat''s teeth, and how can I care for them at home?
- Which changes should prompt me to call you?
- For seniors, are there signs of pain or arthritis I should watch for?

## During the visit

Tell your vet about anything you have noticed, even if it seems minor. If you do not understand a diagnosis or how to give a medicine, ask for it to be explained again or demonstrated. Leave with a clear plan and a date for the next checkup.', '{}'::jsonb, false, '[{"name": "Journal of Feline Medicine and Surgery: 2021 AAHA/AAFP Feline Life Stage Guidelines", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10812130/"}, {"name": "FelineVMA (catvets.com): Your Cat''s Life Stages", "url": "https://catvets.com/wp-content/uploads/2025/12/FelineVMA_Life-Stages_12-25_Web.pdf"}, {"name": "PetMD (Jennifer Coates, DVM; reviewed by Brittany Kleszynski, DVM): Pet Wellness Exams: Costs and What To Expect", "url": "https://www.petmd.com/general-health/pet-wellness-exams-how-prepare"}, {"name": "FelineVMA (catvets.com): You and your Cat Deserve a Cat Friendly Practice", "url": "https://catvets.com/wp-content/uploads/2025/04/FelineVMA_Cat_Friendly_Practice-Web.pdf"}, {"name": "International Cat Care: Taking your cat to the vet", "url": "https://icatcare.org/articles/taking-your-cat-to-the-vet"}]'::jsonb, 2, '2026-10-08'),
('gentle-massage-and-touch-your-cat-enjoys', 'massage', '🤲', 'Gentle massage and touch your cat enjoys', 'Where most cats like to be stroked, which areas to avoid, how to let your cat lead and the signs that it is time to stop.', 4, '## Touch on your cat''s terms

Many cats enjoy being stroked, but each cat has its own likes and limits. The best touch is gentle, short and chosen by your cat. A calm stroking session can be a lovely part of your bond, as long as your cat stays in control.

## Let your cat make the first move

International Cat Care suggests letting your cat come to you rather than reaching out first.

- Sit or crouch low and turn slightly side-on, which looks less threatening.
- Offer a relaxed hand or finger and wait for your cat to sniff or rub against it.
- If your cat has not come over within a minute or two, Cats Protection advises taking that as a no for now.
- Avoid picking your cat up unless you need to.

## Where most cats like to be touched

Cats have scent glands on the face, and many enjoy gentle strokes there. FelineVMA notes that cats often prefer touch around the cheeks and the area between the eyes and ears.

- **Usually enjoyed:** cheeks, chin, top of the head and around the base of the ears. Some cats also like the neck and shoulders.
- **Depends on the cat:** the back, sides and chest.
- **Usually best avoided:** the belly, legs and paws, the tail and the area at the base of the tail.

A study by Ellis and colleagues in 2015 found that cats reacted most negatively when stroked near the base of the tail. A cat rolling over to show its belly is often relaxed, not asking for a belly rub.

## How to stroke

- Use slow, gentle strokes in the direction of the fur. Do not pat.
- Try the three-second rule from International Cat Care. Stroke for about three seconds, then pause. If your cat nudges or leans in for more, carry on.
- Keep sessions short and end while your cat is still enjoying it.
- Use a soft voice and a quiet room, especially with a shy cat.

## Signs your cat is enjoying it

- Rubbing or nudging your hand
- Leaning in, or following your hand when you stop
- A relaxed body, soft eyes and sometimes purring or dribbling

## Signs to stop

Stop and give your cat space if you see any of these.

- **Tail swishing, flicking or thumping**
- **Skin rippling or twitching** along the back
- **Ears turning sideways or flattening back**
- Turning the head sharply towards your hand
- Freezing, tensing or moving away
- Quick licking of the lips or a sudden burst of grooming
- Hissing, growling or biting

Some cats freeze rather than move away. A still cat is not always a happy one.

## If your cat suddenly dislikes touch

VCA explains that pain is a common reason a cat starts biting when stroked. Sore ears, teeth, joints or skin can all make touch unpleasant. If your cat has become touchy or bites when a certain area is touched, contact your veterinarian for a check.

Never punish a cat for biting or swatting. Give it space and try again later, keeping to the areas it likes best.', '{}'::jsonb, false, '[{"name": "International Cat Care: Cat Friendly Interaction", "url": "https://icatcare.org/articles/cat-friendly-interaction"}, {"name": "Cats Protection: How do you pet a cat?", "url": "https://www.cats.org.uk/cats-blog/how-to-pet-a-cat"}, {"name": "Applied Animal Behaviour Science (Ellis et al. 2015): The influence of body region, handler familiarity and order of region handled on the domestic cat''s response to being stroked", "url": "https://agris.fao.org/search/fr/records/65debad20f3e94b9e5d0b2ca"}, {"name": "FelineVMA (catvets.com): Positive Reinforcement Training Educational Toolkit", "url": "https://catvets.com/wp-content/uploads/2026/01/Positive-Reinforcement-Training-Educational-Toolkit_Complete.pdf"}, {"name": "VCA Animal Hospitals: Cat Behavior Problems - Aggression - Petting Aggression", "url": "https://vcahospitals.com/know-your-pet/cat-behavior-problems---aggression---petting-aggression"}]'::jsonb, 1, '2026-10-08'),
('reading-cat-body-language', 'massage', '👀', 'Reading cat body language', 'How to read your cat''s tail, ears, eyes, whiskers and posture, what a slow blink means and why purring is not always a happy sign.', 4, '## Look at the whole cat

Cats say a lot without making a sound. No single signal tells the full story, so look at the tail, ears, eyes, whiskers and body together. Think about the setting too. A wide-eyed cat in a dim room may simply be adjusting to the light.

## Tail

- **Held upright, often with a curl at the tip:** a friendly, confident cat, often saying hello.
- **Tucked close to the body or between the legs:** worried or frightened.
- **Held out and swishing slowly:** possibly frustrated or focused on something.
- **Lashing or twitching fast:** annoyed or upset. Give your cat space.
- **Puffed up, with an arched back:** frightened and trying to look bigger. Back away calmly.

## Ears

- **Upright and facing forward:** relaxed and interested.
- **Upright but turned outwards:** on alert, or frustrated.
- **Flattened sideways or back against the head:** frightened or angry.

## Eyes and the slow blink

Soft, almond-shaped or half-closed eyes are a sign of a relaxed cat. A hard, unblinking stare is used between cats in tense meetings. Very wide eyes with large pupils can mean fear, but they can also come from excitement or low light.

A slow blink is a gentle, slow closing and opening of the eyes. A 2020 study by Humphrey and colleagues found that cats narrowed their eyes more when their owner slow blinked at them. Cats were also more likely to approach an unfamiliar person who had slow blinked at them. The authors suggest the slow blink may be a form of positive communication between cats and people.

To try it, soften your gaze, blink slowly and then look away a little. Your cat may blink back.

## Whiskers

- **Relaxed and pointing out to the sides:** calm.
- **Fanned forward:** alert, interested or tense.
- **Flat against the face or bunched together:** nervous or frightened.

## Posture

- **Lying stretched out or curled loosely:** relaxed.
- **Crouched low, head pulled in, all four paws on the ground:** anxious.
- **Back arched with fur on end, standing side-on:** threatened. Do not approach.
- **Rolling onto the back:** usually a friendly greeting or an invitation to play. PDSA notes it does not usually mean your cat wants a belly rub.

Rubbing the head or body against your legs is a greeting and a way of sharing scent.

## What purring can mean

Purring is often a sign of a content cat, especially when the body is relaxed. Kittens purr while feeding, and adult cats often purr in greeting.

Purring is not always a happy signal, though. PDSA explains that cats can also purr when anxious, worried or in pain. If your cat purrs at an odd time, such as at the vet or while hiding, check the rest of its body language.

## When behaviour changes

You know your cat''s normal signals best. If your usually friendly cat starts hiding, flattening its ears when touched or reacting to being handled, it may be stressed or in pain. Contact your veterinarian if the change lasts or comes with other signs, such as eating less.', '{}'::jsonb, false, '[{"name": "International Cat Care: Cat Communication", "url": "https://icatcare.org/articles/cat-communication"}, {"name": "PDSA: Cat body language", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/kittens-cats/cat-body-language"}, {"name": "Scientific Reports (Humphrey et al. 2020): The role of cat eye narrowing movements in cat-human communication", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7536207/"}, {"name": "VCA Animal Hospitals: Cat Behavior Problems - Aggression - Petting Aggression", "url": "https://vcahospitals.com/know-your-pet/cat-behavior-problems---aggression---petting-aggression"}]'::jsonb, 2, '2026-10-08'),
('how-smart-are-cats', 'mind', '🧠', 'How smart are cats?', 'What research says about cats tracking hidden objects, knowing their name and your voice, and judging amounts, plus why there is no cat IQ test.', 4, '## A growing field

Scientists have studied dogs'' minds far more than cats''. Cat research is catching up, and it shows that cats notice a lot about their world and the people in it. Here is what some of the studies have found, and what they cannot tell us.

## Out of sight, not out of mind

Object permanence is knowing that something still exists when you cannot see it. Earlier studies, summarised in a 2025 paper by Forman and colleagues, found that cats can follow a toy hidden in front of them and search for it in the right place.

Harder tasks, where the object is moved out of sight, give mixed results. In the 2025 study, many cats did not search at all. The authors suggest motivation may have played a big part. A cat that is not interested in the toy will not look for it, however clever it is.

## They know their name

In a 2019 study, Saito and colleagues played recordings of words to cats at home. Cats responded more, often by moving their ears or head, when they heard their own name after a list of similar-sounding words. This held even when a stranger said the words.

This shows cats can pick out their name from other words. It does not prove they understand that the name refers to them. They may simply have learned that the sound often comes before food, attention or something else important.

## They know your voice

An earlier study by Saito and Shinozuka found that cats could tell their owner''s voice from strangers'' voices, using sound alone. A 2021 study by Takagi and colleagues went further. Cats seemed surprised when their owner''s voice suddenly came from a different place in the home. The authors suggest cats may keep a mental map of where their owner is, based on the voice.

## Judging amounts

Cats can tell more from less, at least when the difference is clear. In a 2023 study, seven-week-old kittens usually chose the larger amount of food when the difference was big, such as one piece against three. They did not reliably pick the larger amount when it was close, such as three against four. Earlier work showed adult cats could be trained to tell two from three.

## There is no cat IQ test

There is no validated IQ test for cats, and no single score that measures how smart a cat is. Each study looks at one skill, usually with a small group of cats.

Cats are also hard to test. In a 2023 study comparing cats and dogs, fewer than half of the cats tested in a lab made a choice in most trials. Cats did better at home. Their results depended on mood, comfort and motivation as much as ability.

## Every cat is different

Cats vary a lot. In these studies, age, home life and the test setting all seemed to affect how cats responded. A cat that ignores a puzzle may simply not care about the prize.

You can support your cat''s curiosity with play, food puzzles and short reward-based training. Watch what your own cat enjoys and build on that.', '{}'::jsonb, false, '[{"name": "Scientific Reports (Saito et al. 2019): Domestic cats (Felis catus) discriminate their names from other words", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6449508/"}, {"name": "PLoS One (Takagi et al. 2021): Socio-spatial cognition in cats: Mentally mapping owner''s location from voice", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8580247/"}, {"name": "PLoS One (Forman et al. 2025): Object permanence in domestic cats (Felis catus) using violation-of-expectancy by owner and stranger", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12240391/"}, {"name": "Animal Cognition (Szenczi et al. 2023): Quantity discrimination by kittens of the domestic cat (Felis silvestris catus)", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10344966/"}, {"name": "Scientific Reports (Salamon et al. 2023): Dogs outperform cats both in their testability and relying on human pointing gestures: a comparative study", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10587310/"}]'::jsonb, 1, '2026-10-08'),
('feelings-and-bonds-cat-emotional-intelligence', 'mind', '💞', 'Feelings and bonds: cat emotional intelligence', 'What studies show about cats'' attachment to people, how they read our emotions and the slow blink, and why there is no cat EQ test.', 4, '## Not as aloof as their reputation

Cats are often called independent or unfriendly. A 2023 review by Croney and colleagues describes this as a myth. The authors suggest cats are better described as flexible in their social lives than as anti-social. Their behaviour depends on early experience and personal preference.

Research over the past decade shows that many cats form real bonds with people and pay close attention to how we feel.

## Attachment to their people

In a 2019 study, Vitale and colleagues used methods first developed to study attachment in human infants. They found that cats show distinct attachment styles towards their caregivers, as human babies and dogs do.

- **Secure attachment:** the Croney review notes that about two thirds of the cats in the study were securely attached to their owners.
- **Insecure attachment:** the remaining cats showed insecure styles.

The review also notes that cats can show distress when their owner leaves, much like dogs. A strong bond means your presence can help your cat feel safer.

## Looking to you for guidance

Social referencing means checking another''s reaction to decide how to respond to something new. In a 2015 study by Merola and colleagues, owners reacted to an unfamiliar object in either a happy or a fearful way. Most cats, 79 percent, looked back and forth between the owner and the object. The cats also changed their behaviour to some degree to match their owner''s message.

## Reading human emotions

Cats seem to pick up on our emotional cues.

- In a 2020 study, Quaranta and colleagues played the sound of a person laughing or growling. Cats looked longer at the photo of a face that matched the emotion in the voice.
- The same cats showed more signs of stress when they heard the angry sounds.
- An earlier study, cited by Quaranta, found that cats behaved more positively towards owners who looked happy than towards owners who looked angry.

These studies were small, so the findings are a starting point rather than final answers.

## The slow blink

A 2020 study by Humphrey and colleagues found that cats narrowed their eyes more when their owner slow blinked at them. Cats were also more likely to approach a stranger who slow blinked. The authors suggest it may be a friendly signal between cats and people. You can try it with your own cat.

## There is no cat EQ test

There is no validated test of emotional intelligence for cats. Studies look at single skills, such as attachment or reading faces, in small groups of cats.

Cats also differ a lot. The Croney review describes a study where about half of the cats preferred time with a person over food, toys or interesting scents. Other cats chose differently. Cats also spent more time near people who paid attention to them.

## Building the bond

- Let your cat choose when to come close.
- Give attention when your cat seeks you out.
- Keep your routine and your mood around your cat as calm as you can.
- Try a slow blink as a gentle hello.', '{}'::jsonb, false, '[{"name": "The Veterinary Journal (Croney et al. 2023): CATastrophic myths part 1: common misconceptions about the social behavior of domestic cats", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10841747/"}, {"name": "Current Biology (Vitale et al. 2019): Attachment bonds between domestic cats and humans", "url": "https://doi.org/10.1016/j.cub.2019.08.036"}, {"name": "Animal Cognition (Merola et al. 2015): Social referencing and cat-human communication", "url": "https://pubmed.ncbi.nlm.nih.gov/25573289/"}, {"name": "Animals (Quaranta et al. 2020): Emotion recognition in cats", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7401521/"}, {"name": "Scientific Reports (Humphrey et al. 2020): The role of cat eye narrowing movements in cat-human communication", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7536207/"}]'::jsonb, 2, '2026-10-08'),
('grooming-by-coat-type', 'grooming', '🪮', 'Grooming by coat type', 'How often to brush short and long coats, how to deal with mats, caring for hairless skin, using a flea comb and making grooming pleasant.', 4, '## Why help with grooming

Cats spend a lot of time grooming themselves, but many still benefit from your help. Brushing removes loose hair and can mean fewer hairballs. It is also a good chance to check your cat''s skin and body. Older cats and cats with arthritis or extra weight may struggle to reach every spot and need more help.

## Short coats

- **How often:** at least once a week.
- **Moulting:** brush more often in spring and autumn, when shedding peaks. Cats Protection suggests twice a week, and International Cat Care suggests daily during heavy moulting.
- **Tools:** a bristle brush, a rubber grooming mitt or pad, and a fine-toothed flea comb.

## Long coats

- **How often:** daily, but only for as long as your cat is comfortable.
- **Tools:** a wide-toothed comb or a long-toothed metal comb, and a rubber pad or mitt.
- **Where to check:** mats often form behind the ears, in the armpits, along the back of the legs, in the groin and between the toes.

## Dealing with mats

- Tease small knots apart gently with your fingers, working slowly from the root to the tip.
- **Never use scissors.** It is very hard to see where matted fur ends and skin begins, and it is easy to cut your cat.
- Large or tight mats need a vet or professional groomer. Some cats need sedation for this, which your vet can advise on.
- If the skin under a mat looks red or sore, see your vet.
- Brush out tangles before any bath. Wet mats become much harder to remove.

## Hairless cats

Hairless breeds such as the Sphynx have no coat to soak up skin oils, so oil and dirt build up on the skin.

- PDSA notes they need frequent baths. Use a shampoo made for cats and ask your vet how often suits your cat.
- Check the skin regularly, including between wrinkles, for redness or sores.
- Check the ears are clean and healthy.
- They burn easily in the sun and can get cold quickly. Offer warm bedding and shady, cool spots.

Contact your vet about any skin changes.

## Using a flea comb

Start each grooming session with a fine-toothed flea comb. Flea dirt looks like tiny black, comma-shaped specks. They turn red when you add a drop of water. If you find it, ask your vet team about flea control made for cats.

## Making grooming pleasant

- Start gently with kittens, so grooming feels normal.
- Choose a time when your cat is relaxed.
- Keep sessions short and build up slowly.
- Use as little restraint as possible, and let your cat walk away if it wants to.
- End with praise or a treat, before your cat gets fed up.

Stop if you see tail swishing, skin twitching, ears turning back, lip licking or growling. Try again later with a smaller goal.

## When to see the vet

A change in grooming habits can be a sign of a problem. Cats Protection advises a vet visit if your cat grooms much more or much less than usual, or has bald patches or sore skin.', '{}'::jsonb, false, '[{"name": "International Cat Care: Grooming your cat", "url": "https://icatcare.org/articles/grooming-your-cat"}, {"name": "Cats Protection: Grooming your cat", "url": "https://www.cats.org.uk/help-and-advice/cat-behaviour/grooming"}, {"name": "VCA Animal Hospitals: Grooming and Coat Care for Your Cat", "url": "https://vcahospitals.com/know-your-pet/grooming-and-coat-care-for-your-cat"}, {"name": "PDSA: Sphynx", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/kittens-cats/sphynx"}, {"name": "Cats Protection: Hairless cats", "url": "https://www.cats.org.uk/extreme-traits/hairless-cats"}]'::jsonb, 1, '2026-10-08'),
('nails-teeth-ears-and-eyes', 'grooming', '🦷', 'Nails, teeth, ears and eyes', 'How to trim claws, brush teeth with cat toothpaste, spot dental disease and check ears and eyes, plus when to call the vet.', 5, '## A quick regular check

PDSA suggests a gentle nose-to-tail check at least a couple of times a week. Choose a calm moment, keep it short and reward your cat afterwards. Only look in the mouth if your cat is comfortable with it.

## Claws

Most cats keep their claws at a good length by scratching. Older or less mobile cats, such as those with arthritis, may not scratch as much. Their claws can overgrow, catch on fabric or even grow into the pads.

Signs claws may be too long include catching on carpets or bedding, claws showing when your cat is resting, and tapping on hard floors.

**Trimming steps**

- Pick a time when your cat is relaxed, in good light.
- Sit your cat on your lap facing away from you, or wrap it gently in a towel with one leg free.
- Press gently on the top of a toe to extend the claw. Be extra gentle with older cats.
- Use claw clippers to snip only the clear tip.
- Avoid the quick, the blood vessel you can see running down the centre of the claw.
- Stop if your cat becomes anxious and try again another day.
- Finish with a treat or a game.

If you are unsure, your vet team can trim the claws and show you how.

## Teeth

Dental disease is one of the most common problems vets see in cats. FelineVMA reports that up to 85 percent of cats show signs of gum disease by two years of age. It is painful, and many cats keep eating normally even when their mouth hurts.

**Signs to watch for**

- Bad breath
- Red, swollen or bleeding gums
- Chewing on one side, or dropping food
- Pawing at the mouth or drooling
- A swollen face
- Eating less, losing weight or grooming less

Contact your vet if you notice any of these.

**Brushing at home**

Daily brushing is the ideal. Use only toothpaste made for cats. International Cat Care advises never using human toothpaste, which can upset a cat''s stomach.

- Get your cat used to gentle touch around the face and mouth, with rewards.
- Let your cat lick cat toothpaste from your finger.
- Next, rub a little onto the teeth with a cotton bud in small circles.
- Move on to a soft cat toothbrush. Start with about 10 seconds per side.
- Begin with the back teeth, which matter most, and work forward.
- Stop if your cat is distressed and try again later.

If brushing is not possible, ask your vet about dental wipes or products with the Veterinary Oral Health Council seal. Dental checks are part of routine vet visits, usually every 6 to 12 months.

## Ears

Healthy ears are clean, with little wax and no bad smell. Call your vet if the ears are smelly, waxy, swollen or sore, or if your cat scratches them, shakes its head or tilts it to one side. Do not clean inside the ears unless your vet has shown you how.

## Eyes

Healthy eyes are bright and clear, with no discharge and the area around the eyeball pink. Call your vet if the eyes look red, sore, weepy, crusty or cloudy, or if your cat squints or keeps an eye closed. VCA lists eye problems among the signs that need prompt veterinary attention, so do not wait.', '{}'::jsonb, false, '[{"name": "International Cat Care: Trimming your cat''s claws", "url": "https://icatcare.org/articles/trimming-your-cats-claws"}, {"name": "International Cat Care: How to brush your cat''s teeth", "url": "https://icatcare.org/articles/how-to-brush-your-cats-teeth"}, {"name": "FelineVMA (catvets.com): Feline Dental Care", "url": "https://catvets.com/wp-content/uploads/2025/12/FelineVMA_Dental_Oral_Care_brochure_Web.pdf"}, {"name": "PDSA: How to give your pet a health check at home", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/how-to-give-your-pet-a-health-check-at-home"}, {"name": "VCA Animal Hospitals: Recognizing the Signs of Illness in Cats", "url": "https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats"}]'::jsonb, 2, '2026-10-08'),
('body-condition-and-healthy-weight', 'health', '⚖️', 'Body condition and healthy weight', 'How to check your cat''s body condition at home with the 9-point scale, why extra weight matters and why weight loss must be slow and vet-guided.', 4, '## Why weight matters

Extra weight is one of the most common health problems in pet cats. Cornell Feline Health Center reports that around half of the cats seen at vet clinics may be overweight or obese. Being too heavy or too thin can shorten a cat''s life.

Obesity raises the risk of, or worsens, several conditions:

- Diabetes
- Arthritis and joint pain
- Urinary tract problems
- Breathing problems such as asthma
- Fatty liver disease
- Higher risks during anaesthesia

## The body condition score

Vets use a body condition score, or BCS, to judge body fat. The World Small Animal Veterinary Association (WSAVA) chart uses a 9-point scale. Some charts use a 5-point scale instead, so ask your vet which one they use.

- **1 to 3, under ideal:** ribs easy to feel, or visible on short-coated cats, with little or no fat. The spine is easy to see or feel and there is a marked tuck at the belly.
- **4 to 5, ideal:** well proportioned. You can feel the ribs under a slight layer of fat, see a waist behind the ribs, and there is only a small fat pad on the belly.
- **6 to 9, over ideal:** ribs harder to feel under fat, the waist fades and then disappears, and the belly becomes rounder. At 9, there is heavy fat over the back, face and legs.

## Checking at home

Cornell suggests three simple checks.

- **Rib check:** run both hands gently along the ribcage. You should feel the ribs without pressing hard.
- **Side view:** look at your cat from the side. The belly should not hang low or look rounded.
- **Top view:** look down from above. You should see a gentle waist behind the ribs.

In long-haired cats, feeling with your hands matters more than looking. Weighing your cat regularly, for example with baby scales, helps you spot slow changes.

## Losing weight safely

If your cat is overweight, talk to your veterinarian before changing anything. Cornell advises that any weight loss plan should be run under a vet''s direction. Your vet may check for other health problems first and suggest a suitable diet and portion size.

- **Go slowly.** Cornell suggests a gradual loss of about 1 to 2 percent of body weight per week. A very overweight cat may take up to a year to reach a healthy shape.
- **Weigh food** rather than using a scoop, as it is easy to overfill.
- **Cut back on treats** and human food.
- **Add play and puzzle feeders** to increase activity.
- **Weigh your cat regularly** and share results with your vet.

## Never use a crash diet

Never starve your cat or cut its food sharply. When a cat stops eating, its body breaks down fat faster than the liver can handle. Fat builds up in the liver, causing hepatic lipidosis, a serious and sometimes fatal liver disease. Overweight cats are most at risk.

VCA notes this often follows a few days of little or no eating. If your cat, especially an overweight one, stops eating, contact your vet promptly.

## Keeping it off

Once your cat reaches a healthy weight, keep up regular weigh-ins and body checks. Neutered and indoor cats often need fewer calories, so ask your vet how much to feed.', '{}'::jsonb, false, '[{"name": "WSAVA Global Nutrition Committee: Body Condition Score (cat)", "url": "https://wsava.org/wp-content/uploads/2020/01/Cat-Body-Condition-Scoring-2017.pdf"}, {"name": "Cornell Feline Health Center: Obesity", "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/obesity"}, {"name": "International Cat Care: Obesity in Cats", "url": "https://icatcare.org/articles/obesity-in-cats"}, {"name": "VCA Animal Hospitals: Hepatic Lipidosis in Cats (Fatty Liver Syndrome in Cats)", "url": "https://vcahospitals.com/know-your-pet/liver-disease-fatty-liver-syndrome-in-cats"}]'::jsonb, 1, '2026-10-08'),
('signs-of-pain-and-illness-cats-hide', 'health', '🔍', 'Signs of pain and illness cats hide', 'The facial signs of pain, the behaviour and litter tray changes to watch for, and the arthritis signs that cats often hide.', 5, '## Why cats hide pain

Cats are experts at hiding discomfort. FelineVMA explains that this comes from their wild ancestors, for whom looking weak could attract predators. As a result, signs of pain and illness are often subtle and easy to miss.

You know your cat''s normal habits better than anyone. Even a small change can be the first clue that something is wrong.

## The face can show pain

The Feline Grimace Scale was developed by researchers at the Université de Montréal. In a 2019 study, Evangelista and colleagues showed that changes in five parts of the face could reliably tell painful cats from healthy ones. The scale was designed to assess acute, or sudden, pain.

- **Ears:** pulled apart and turned outwards.
- **Eyes:** narrowed or squinting.
- **Muzzle:** tense and flattened, looking more oval than round.
- **Whiskers:** straight and pushed forward, away from the face.
- **Head:** held low, below the shoulders, or tilted down with the chin towards the chest.

The scale''s website says it can be used by cat owners as well as vet teams. It is a guide to help you notice pain, not a diagnosis. If you see these signs, contact your vet.

## Behaviour changes to watch for

FelineVMA advises contacting your vet if you notice any of these:

- Eating less or losing interest in food
- Hiding or withdrawing from the family
- Moving less, or hesitating to jump or climb
- Less play and lower activity
- Difficulty getting up, standing or walking
- Grooming less
- Sitting hunched or tucked up instead of curling up to sleep
- Reacting or crying out when touched
- Becoming irritable, aggressive or seeking to be alone

Some sick cats become clingy rather than withdrawn. Sleeping more, restlessness at night or new howling can also be signs that something is wrong.

## Grooming changes

A cat that stops grooming may develop a greasy, scruffy or matted coat. Some cats groom too much instead, which can cause bald patches or sore skin. Both are worth a vet check.

## Litter tray changes

- Straining, or going in and out often
- Producing more or less urine than usual
- Diarrhoea, or small, hard stools
- Toileting outside the tray

A cat straining with little or no urine needs a vet straight away. This can be an emergency.

## Arthritis in older cats

FelineVMA describes arthritis as extremely common in cats and often missed. International Cat Care notes it is much more common in older cats. Signs include:

- Jumping less, or hesitating before jumping up or down
- Struggling with stairs
- Difficulty getting in and out of the litter tray
- Overgrown claws from scratching less
- Sleeping more, and choosing easy-to-reach spots
- Less playing and exploring
- Being grumpier when handled

Cats often hide these signs at the clinic. A short video of your cat on the stairs or jumping down can help your vet.

## What to do

If you notice any change, contact your veterinarian. Never give your cat any medicine without talking to your vet first. Your vet can examine your cat and suggest a plan, which may include medicine, soft bedding, ramps or other home changes.', '{}'::jsonb, false, '[{"name": "Feline Grimace Scale (Université de Montréal): Easy Acute Pain Assessment in Cats", "url": "https://www.felinegrimacescale.com/"}, {"name": "Scientific Reports (Evangelista et al. 2019): Facial expressions of pain in cats: the development and validation of a Feline Grimace Scale", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6911058/"}, {"name": "FelineVMA (catvets.com): How Do I Know if my Cat is in Pain? Feline Pain Management", "url": "https://catvets.com/wp-content/uploads/2024/12/FelineVMA-Pain-Management_Web.pdf"}, {"name": "International Cat Care: Arthritis in cats", "url": "https://icatcare.org/articles/arthritis-in-cats"}, {"name": "VCA Animal Hospitals: Recognizing the Signs of Illness in Cats", "url": "https://vcahospitals.com/know-your-pet/recognizing-signs-of-illness-in-cats"}]'::jsonb, 2, '2026-10-08')
on conflict (slug) do update set category = excluded.category, icon = excluded.icon, title = excluded.title, summary = excluded.summary,
  read_minutes = excluded.read_minutes, body_md = excluded.body_md, audience = excluded.audience, urgent = excluded.urgent,
  sources = excluded.sources, sort_order = excluded.sort_order, reviewed = excluded.reviewed, active = true;
