from core.services import user_service


def test_verify_admin_on_non_admin_returns_false(client, auth_headers):
    response = client.get(
        "/api/v1/admin/verify/",
        headers=auth_headers,
    )
    
    data = response.json()
    assert data["is_admin"] == False
    
    
def test_verify_admin_on_admin_returns_true(client, test_user, db_session, auth_headers):
    user_service.set_admin(user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session)
    
    response = client.get(
        "/api/v1/admin/verify/",
        headers=auth_headers,
    )
    
    data = response.json()
    
    print(data)
    assert data["is_admin"] == True