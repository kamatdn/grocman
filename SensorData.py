import json
import random
import datetime
import boto3
import time

smartContainerIds = ['B000JMAXMY1199050935', 'B002DMUIE61199050935', 'B007A2QO3S1199050935', 'B0014CTS38716256849', 'B00T8SHY5E716256849']
smartContainerNames = {'B000JMAXMY1199050935':'Mustard Seed','B002DMUIE61199050935':'Toor Dal','B007A2QO3S1199050935':'Moong Dal', 'B0014CTS38716256849':'Oats', 'B00T8SHY5E716256849':'Bread'}
HalfMark = {'B000JMAXMY1199050935':'1','B002DMUIE61199050935':'2','B007A2QO3S1199050935':'2','B0014CTS38716256849':'1', 'B00T8SHY5E716256849':'1'}
smartContainerUserIds = {'B000JMAXMY1199050935':'1199050935','B002DMUIE61199050935':'1199050935','B007A2QO3S1199050935':'1199050935','B0014CTS38716256849':'716256849','B00T8SHY5E716256849':'716256849'}
smartContainerAsins = {'B000JMAXMY1199050935':'B000JMAXMY','B002DMUIE61199050935':'B002DMUIE6','B007A2QO3S1199050935':'B007A2QO3S','B0014CTS38716256849':'B0014CTS38','B00T8SHY5E716256849':'B00T8SHY5E'}
iot = boto3.client('iot-data');

# Generate random weight values
def getWeights():
    data = {}
    data['deviceValue'] = random.randint(0, 1)
    data['deviceId'] = random.choice(smartContainerIds)
    data['half_mark'] = HalfMark[data['deviceId']]
    data['deviceName'] = smartContainerNames[data['deviceId']]
    data['asin'] = smartContainerAsins[data['deviceId']]
    data['userId'] = smartContainerUserIds[data['deviceId']]
    data['deviceTimeStamp'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return data


# Generate input in varying proportions at regular intervals. This mimics smart container posting data to cloud.
while True:
    time.sleep(60)
    data = json.dumps(getWeights())
    print(data)
    response = iot.publish(
             topic='/sc/weight',
             payload=data
        )    
