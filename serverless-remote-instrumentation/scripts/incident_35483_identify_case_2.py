# Incident doc - https://docs.google.com/document/d/1QD4Xcg90dbzte7NcrGPEULO4-KWcsmVtcssdWrG4Wgk/edit?tab=t.0
# Identified keys - https://docs.google.com/document/d/1ci9pW9CXcITKD3QHPjWhsCCgoiN-VRuSs7xxqxTfesc/edit?tab=t.0

try:
	import boto3
	import json
	import re

	from datetime import datetime
	from time import sleep
except:
	print('Error importing dependencies, try running')
	print('pip3 install boto3')
	raise

query_text = '''
fields @message
| filter @message like /Retrieved all lambda/
| filter @message not like /\\*\\*\\*\\*/
| limit 10000
'''

region = "ap-southeast-2"
start_time = 1714155821000 #2024-04-26
end_time = int(datetime.now().timestamp())


if __name__ == '__main__':
	session = boto3.session.Session(region_name=region)
	logs = session.client('logs')

	log_groups = logs.describe_log_groups(logGroupNamePattern="remote")
	logGroupNames = [group['logGroupName'] for group in log_groups['logGroups']]

	query = logs.start_query(
		logGroupNames=logGroupNames,
		startTime=start_time,
		endTime=end_time,
		queryString=query_text,
	)

	query_id = query['queryId']
	status = 'Scheduled'
	result = None

	while status in ['Scheduled', 'Running']:
		sleep(5)
		result = logs.get_query_results(queryId=query_id)
		status = result['status']

	messages = []
	hits = result['results']
	for hit in hits:
		for field in hit:
			if field['field'] == '@message':
				messages.append(field['value'])
	
	keys = set([])
	for message in messages:
		matches = re.findall('"DD_API_KEY":".*"', message)
		# I'm not great with regular expressions so
		without_key = [match[len('"DD_API_KEY":"'):-2] for match in matches]
		without_extras = [match[0:match.index('"')] for match in without_key]
		keys.update(without_extras)

	print(region)
	print('\n'.join(keys))
