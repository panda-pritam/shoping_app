import json
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from .models import Location

@csrf_exempt
def location_list(request):
    if request.method == 'GET':
        locations = list(Location.objects.values())
        return JsonResponse(locations, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            location = Location.objects.create(
                name=data['name'],
                lat=data['lat'],
                lng=data['lng'],
                location_name=data['location_name'],
                type=data['type'],
                usage=data['usage'],
                bockmarked=data['bookmarked'],
                status=data.get('status', 'active'),
                last_serviced_date=data.get('last_serviced_date')
            )
            return JsonResponse({'id': location.id, 'message': 'Location created'}, status=201)
        except (KeyError, json.JSONDecodeError) as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

@csrf_exempt
def location_detail(request, pk):
    try:
        location = Location.objects.get(pk=pk)
    except Location.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': location.id,
            'name': location.name,
            'lat': location.lat,
            'lng': location.lng,
            'location_name': location.location_name,
            'type': location.type,
            'usage': location.usage,
            'status': location.status,
            'bookmarked':location.bockmarked,
            'last_serviced_date': location.last_serviced_date,
            'created_at': location.created_at,
            'updated_at': location.updated_at,
        })

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body.decode('utf-8'))
            location.name = data.get('name', location.name)
            location.lat = data.get('lat', location.lat)
            location.lng = data.get('lng', location.lng)
            location.location_name = data.get('location_name', location.location_name)
            location.type = data.get('type', location.type)
            location.usage = data.get('usage', location.usage)
            location.status = data.get('status', location.status)
            location.last_serviced_date = data.get('last_serviced_date', location.last_serviced_date)
            location.bockmarked=data.get('bockmarked',location.bockmarked)
            location.save()
            return JsonResponse({'message': 'Location updated'})
        except (KeyError, json.JSONDecodeError) as e:
            return HttpResponseBadRequest(str(e))

    elif request.method == 'DELETE':
        location.delete()
        return JsonResponse({'message': 'Location deleted'})

    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


from django.db.models import Q

def filter_locations(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    query = request.GET.get('q')  # Unified search for name and location_name and type
    loc_type = request.GET.get('type')

    filters = Q()
    if query:
        filters &= (
            Q(name__icontains=query) |
            Q(location_name__icontains=query) |
            Q(type__icontains=query)
        )
    if loc_type:
        filters &= Q(type__iexact=loc_type)  # Case-insensitive exact match

    locations = Location.objects.filter(filters).values()
    return JsonResponse(list(locations), safe=False)