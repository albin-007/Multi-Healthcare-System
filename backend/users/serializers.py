from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from users.models import User, Clinic, Doctor, Complaint, Feedback, Lab, VerificationDocument, Notification, LabTest, TestRequest


class VerificationDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = VerificationDocument
        fields = ['id', 'entity_type', 'entity_id', 'document_type', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'status', 'is_verified', 'first_name', 'last_name', 'phone_number', 'display_name', 'age', 'gender', 'avatar', 'avatar_url']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_display_name(self, obj):
        if obj.role == User.Role.CLINIC and hasattr(obj, 'clinic_profile'):
            return obj.clinic_profile.name
        elif obj.role == User.Role.DOCTOR and hasattr(obj, 'doctor_profile'):
            return obj.doctor_profile.name
        elif obj.role == User.Role.LAB and hasattr(obj, 'lab_profile'):
            return obj.lab_profile.name
        
        # Fallback to standard names
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Extra fields for Clinic, Lab, Doctor
    entity_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    owner_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    license_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    specialty = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    qualification = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pincode = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone_number',
                  'entity_name', 'owner_name', 'address', 'description',
                  'license_no', 'specialty', 'qualification', 'age', 'gender',
                  'city', 'pincode', 'website']

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Administrator registration is not permitted.")
        if value == User.Role.DOCTOR:
            raise serializers.ValidationError("Doctor accounts are created by clinics. Please contact your clinic administrator.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.USER)
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password'],
                role=role,
                phone_number=validated_data.get('phone_number', ''),
                age=validated_data.get('age'),
                gender=validated_data.get('gender', '')
            )
            
            entity_name = validated_data.get('entity_name', '')
            owner_name = validated_data.get('owner_name', '')
            address = validated_data.get('address', '')
            description = validated_data.get('description', '')
            license_no = validated_data.get('license_no', '')
            specialty = validated_data.get('specialty', '')
            qualification = validated_data.get('qualification', '')
            city = validated_data.get('city', '')
            pincode = validated_data.get('pincode', '')
            website = validated_data.get('website', '')

            if role == User.Role.CLINIC:
                Clinic.objects.create(
                    admin_user=user, name=entity_name,
                    owner_name=owner_name, address=address,
                    city=city, pincode=pincode,
                    description=description, license_no=license_no,
                    website=website
                )
            elif role == User.Role.LAB:
                Lab.objects.create(
                    admin_user=user, name=entity_name,
                    owner_name=owner_name, address=address,
                    city=city, pincode=pincode,
                    description=description, license_no=license_no,
                    website=website
                )
            elif role == User.Role.DOCTOR:
                Doctor.objects.create(
                    user=user,
                    name=entity_name or user.username,
                    specialty=specialty,
                    qualification=qualification,
                    license_no=license_no
                )
                
        return user

class ClinicSerializer(serializers.ModelSerializer):
    admin_user = UserSerializer(read_only=True)  # type: ignore
    documents = serializers.SerializerMethodField()
    class Meta:
        model = Clinic
        fields = ['id', 'name', 'owner_name', 'address', 'city', 'pincode', 'description', 'license_no', 'website', 'admin_user', 'documents', 'created_at', 'payment_type', 'consultation_fee', 'advance_payment']

    def get_documents(self, obj):
        docs = VerificationDocument.objects.filter(entity_type='clinic', entity_id=obj.id)
        return VerificationDocumentSerializer(docs, many=True, context=self.context).data  # type: ignore

class LabTestSerializer(serializers.ModelSerializer):
    lab_details = serializers.SerializerMethodField()
    class Meta:
        model = LabTest
        fields = ['id', 'lab', 'lab_details', 'name', 'description', 'price', 'category', 'created_at']
        read_only_fields = ['lab', 'created_at']

    def get_lab_details(self, obj):
        from .serializers import LabSerializer
        return {
            'id': obj.lab.id,
            'name': obj.lab.name,
            'address': obj.lab.address,
            'city': obj.lab.city,
            'home_collection_available': obj.lab.home_collection_available
        }

class LabSerializer(serializers.ModelSerializer):
    admin_user = UserSerializer(read_only=True)  # type: ignore
    documents = serializers.SerializerMethodField()
    tests = LabTestSerializer(many=True, read_only=True)
    class Meta:
        model = Lab
        fields = ['id', 'name', 'owner_name', 'address', 'city', 'pincode', 'description', 'license_no', 'website', 'admin_user', 'documents', 'tests', 'created_at', 'payment_type', 'consultation_fee', 'advance_payment', 'home_collection_available', 'home_collection_charge', 'average_rating', 'rating_count']

    def get_documents(self, obj):
        docs = VerificationDocument.objects.filter(entity_type='lab', entity_id=obj.id)
        return VerificationDocumentSerializer(docs, many=True, context=self.context).data  # type: ignore

class FeedbackSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)  # type: ignore
    doctor_name = serializers.CharField(source='target_doctor.name', read_only=True)
    lab_name = serializers.CharField(source='target_lab.name', read_only=True)
    
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['user']

class DoctorSerializer(serializers.ModelSerializer):
    clinic = ClinicSerializer(read_only=True)  # type: ignore
    clinic_id = serializers.PrimaryKeyRelatedField(
        queryset=Clinic.objects.all(), source='clinic', write_only=True, required=False
    )
    user_details = UserSerializer(source='user', read_only=True)  # type: ignore
    
    # New fields to create doctor user account
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)

    reviews = FeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'name', 'specialty', 'qualification', 'license_no', 'clinic', 'clinic_id', 'user', 'user_details', 'username', 'password', 'email', 'average_rating', 'rating_count', 'reviews']
        read_only_fields = ['user', 'clinic', 'average_rating', 'rating_count']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value


    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '')
        
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    role=User.Role.DOCTOR,
                    status=User.Status.APPROVED, # automatically approve doctors added by a clinic
                    is_verified=True
                )
                validated_data['user'] = user
                doctor = super().create(validated_data)
                return doctor
        except Exception as e:
            # Catching generic exceptions to prevent 500s, turning them into validation errors
            raise serializers.ValidationError(str(e))


class ComplaintSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)  # type: ignore
    target_details = UserSerializer(source='target_user', read_only=True)  # type: ignore
    
    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['user', 'is_resolved']



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
class TestRequestSerializer(serializers.ModelSerializer):
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    patient_details = UserSerializer(source='patient', read_only=True)

    class Meta:
        model = TestRequest
        fields = ['id', 'doctor', 'doctor_details', 'patient', 'patient_details', 'tests', 'status', 'created_at']
        read_only_fields = ['doctor', 'status', 'created_at']
