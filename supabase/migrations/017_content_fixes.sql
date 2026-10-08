-- 017 Content fixes: quiet_cat hint describes the logging gap, body language article moves to Cat mind.
update care_tips
   set title = 'No logs for this cat lately',
       body  = 'Changes in appetite, litter habits and activity are often the first signs that something is different, and cats tend to hide discomfort. A quick daily note on food and litter makes those changes easier to notice and to describe to your veterinarian.',
       reviewed = '2026-10-08'
 where code = 'hint-quiet-cat';

update knowledge_articles set category = 'mind', sort_order = 3 where slug = 'reading-cat-body-language';
